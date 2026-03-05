import { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { MarketData, ShareType, ColorPalette, GradientConfig } from '@/types';
import { COLORS, MAX_BROKERAGES_PREVIEW } from '@/lib/constants';

interface TreemapProps {
  market: MarketData;
  shareType: ShareType;
  maxBrokerages?: number;
  mode?: 'preview' | 'export' | 'branded';
  darkBg?: boolean;
  palette?: ColorPalette;
  gradient?: GradientConfig;
  fontHeading?: string;
  fontBody?: string;
}

export function MarketShareTreemap({ market, shareType, maxBrokerages, mode = 'preview', darkBg = false, palette, gradient, fontHeading, fontBody }: TreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const max = maxBrokerages ?? MAX_BROKERAGES_PREVIEW;
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setDims(prev => (prev?.w === Math.round(width) && prev?.h === Math.round(height)) ? prev : { w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const sorted = [...market.brokerages].sort((a, b) =>
      shareType === 'dollar'
        ? b.marketShareDollar - a.marketShareDollar
        : b.marketShareUnits - a.marketShareUnits
    );
    return sorted.slice(0, max).map(b => ({
      name: b.name,
      value: shareType === 'dollar' ? b.marketShareDollar : b.marketShareUnits,
      isSothebys: b.isSothebys,
    }));
  }, [market, shareType, max]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || !dims) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dims.w;
    const height = dims.h;
    const lightText = darkBg || mode === 'preview';
    const titleColor = lightText ? COLORS.cream : COLORS.navy;
    const titleSize = mode === 'export' ? 26 : 14;

    // ── SVG defs for gradients ──
    const defs = svg.append('defs');

    // RLSIR cell gradient (diagonal)
    const gDir = gradient?.direction ?? 'diagonal';
    const gx1 = gDir === 'vertical' ? '0%' : '0%';
    const gy1 = '0%';
    const gx2 = gDir === 'vertical' ? '0%' : '100%';
    const gy2 = gDir === 'horizontal' ? '0%' : '100%';
    const rlsirGrad = defs.append('linearGradient')
      .attr('id', 'treemap-rlsir')
      .attr('x1', gx1).attr('y1', gy1)
      .attr('x2', gx2).attr('y2', gy2);

    const useGradient = gradient ? gradient.enabled : true;
    if (useGradient && gradient) {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', gradient.colorStart);
      if (gradient.colorMid) rlsirGrad.append('stop').attr('offset', '50%').attr('stop-color', gradient.colorMid);
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', gradient.colorEnd);
    } else if (darkBg) {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9e8a64');
      rlsirGrad.append('stop').attr('offset', '50%').attr('stop-color', COLORS.gold);
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d4c4a0');
    } else {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', '#001530');
      rlsirGrad.append('stop').attr('offset', '50%').attr('stop-color', COLORS.navy);
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1a5276');
    }

    // Title
    svg.append('text')
      .attr('x', width / 2).attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-family', fontHeading ?? 'Playfair Display')
      .attr('font-size', titleSize)
      .attr('font-weight', '600')
      .attr('fill', titleColor)
      .text(shareType === 'dollar' ? 'Market Share ($)' : 'Market Share (#)');

    const margin = { top: 45, right: 10, bottom: 10, left: 10 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root = d3.hierarchy({ children: data } as any)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3.treemap().size([innerW, innerH]).padding(3).round(true)(root as any);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaves = root.leaves() as any[];

    // Competitor color scale — graduated shades by rank
    const competitorLeaves = leaves.filter((d: any) => !d.data.isSothebys);
    const compScale = darkBg
      ? d3.scaleLinear<string>().domain([0, Math.max(1, competitorLeaves.length - 1)]).range([palette?.competitorBase ?? 'rgba(255,255,255,0.45)', palette?.competitorFade ?? 'rgba(255,255,255,0.15)'])
      : d3.scaleLinear<string>().domain([0, Math.max(1, competitorLeaves.length - 1)]).range([palette?.competitorBase ?? '#6b7f94', palette?.competitorFade ?? '#b8c4ce']);
    let compIdx = 0;

    // Cells
    g.selectAll('rect.cell')
      .data(leaves)
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', (d: any) => {
        if (d.data.isSothebys) return 'url(#treemap-rlsir)';
        const color = compScale(compIdx);
        compIdx++;
        return color;
      })
      .attr('rx', 4)
      .attr('stroke', (d: any) => d.data.isSothebys ? (palette?.accent ?? COLORS.gold) : 'none')
      .attr('stroke-width', (d: any) => d.data.isSothebys ? 1.5 : 0);

    // Name + value labels — use tspan wrapping to show full brokerage names
    leaves.forEach((d: any) => {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      if (w < 35 || h < 20) return; // cell too small for any text

      const cx = (d.x0 + d.x1) / 2;
      const cy = (d.y0 + d.y1) / 2;
      const fontSize = mode === 'export' ? (w > 100 ? 13 : 10) : (w > 100 ? 10 : (w > 60 ? 8 : 7));
      const name: string = d.data.name;

      // Estimate how many chars fit per line (~0.55em per char for Inter)
      const charsPerLine = Math.floor((w - 8) / (fontSize * 0.55));
      if (charsPerLine < 3) return;

      // Word-wrap the name into lines
      const words = name.split(' ');
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (test.length <= charsPerLine) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = word.length > charsPerLine ? word.slice(0, charsPerLine - 1) + '\u2026' : word;
        }
      }
      if (current) lines.push(current);

      // Cap lines by available height (each line ~1.2em + value line)
      const lineHeight = fontSize * 1.2;
      const valueHeight = h > 25 ? fontSize + 4 : 0;
      const maxLines = Math.max(1, Math.floor((h - 6 - valueHeight) / lineHeight));
      const visibleLines = lines.slice(0, maxLines);

      const totalTextH = visibleLines.length * lineHeight + valueHeight;
      const startY = cy - totalTextH / 2 + fontSize * 0.8;

      const textEl = g.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-family', fontBody ?? 'Inter')
        .attr('font-size', fontSize)
        .attr('font-weight', d.data.isSothebys ? '600' : '500')
        .attr('fill', COLORS.white);

      visibleLines.forEach((line, li) => {
        textEl.append('tspan')
          .attr('x', cx)
          .attr('y', startY + li * lineHeight)
          .text(line);
      });

      // Value label below name
      if (valueHeight > 0 && w >= 35) {
        textEl.append('tspan')
          .attr('x', cx)
          .attr('y', startY + visibleLines.length * lineHeight + 2)
          .attr('font-weight', 'bold')
          .attr('font-size', mode === 'export' ? 16 : 11)
          .attr('fill', d.data.isSothebys ? (palette?.accent ?? COLORS.gold) : 'rgba(255,255,255,0.85)')
          .text(`${(d.data.value as number).toFixed(1)}%`);
      }
    });
  }, [data, shareType, mode, darkBg, palette, gradient, fontHeading, fontBody, dims]);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ minHeight: mode === 'export' ? 500 : undefined }} />
  );
}
