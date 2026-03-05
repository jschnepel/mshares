import { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { MarketData, ShareType, ColorPalette, GradientConfig } from '@/types';
import { COLORS, MAX_BROKERAGES_PREVIEW } from '@/lib/constants';

interface LollipopProps {
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

export function MarketShareLollipop({ market, shareType, maxBrokerages, mode = 'preview', darkBg = false, palette, gradient, fontHeading, fontBody }: LollipopProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const max = maxBrokerages ?? MAX_BROKERAGES_PREVIEW;

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
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 700;
    const height = svgRef.current.clientHeight || 450;
    const lightText = darkBg || mode === 'preview';
    const titleColor = lightText ? COLORS.cream : COLORS.navy;
    const titleSize = mode === 'export' ? 26 : 14;
    const labelSize = mode === 'branded' ? 9 : (mode === 'export' ? 14 : 11);
    const bodyFont = fontBody ?? 'Inter';
    const headFont = fontHeading ?? 'Playfair Display';

    // Defs for RLSIR gradient circle
    const defs = svg.append('defs');
    const rlsirGrad = defs.append('linearGradient')
      .attr('id', 'lollipop-rlsir')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');

    if (gradient?.enabled && gradient) {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', gradient.colorStart);
      if (gradient.colorMid) rlsirGrad.append('stop').attr('offset', '50%').attr('stop-color', gradient.colorMid);
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', gradient.colorEnd);
    } else if (darkBg) {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9e8a64');
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d4c4a0');
    } else {
      rlsirGrad.append('stop').attr('offset', '0%').attr('stop-color', '#001530');
      rlsirGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1a5276');
    }

    // Title
    svg.append('text')
      .attr('x', width / 2).attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-family', headFont)
      .attr('font-size', titleSize)
      .attr('font-weight', '600')
      .attr('fill', titleColor)
      .text(shareType === 'dollar' ? 'Market Share ($)' : 'Market Share (#)');

    const margin = { top: 40, right: mode === 'branded' ? 55 : 65, bottom: 10, left: mode === 'branded' ? 140 : 120 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xMax = d3.max(data, d => d.value) ?? 1;
    const xScale = d3.scaleLinear().domain([0, xMax * 1.15]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerH]).padding(0.35);
    const barH = yScale.bandwidth();

    const lineColor = darkBg ? 'rgba(255,255,255,0.15)' : (mode === 'preview' ? 'rgba(255,255,255,0.1)' : '#e5e7eb');
    const compColor = palette?.competitorBase ?? COLORS.grayBar;

    // Lines
    g.selectAll('line.stem')
      .data(data)
      .join('line')
      .attr('class', 'stem')
      .attr('x1', 0)
      .attr('x2', d => xScale(d.value))
      .attr('y1', d => (yScale(d.name) ?? 0) + barH / 2)
      .attr('y2', d => (yScale(d.name) ?? 0) + barH / 2)
      .attr('stroke', d => d.isSothebys ? (palette?.accent ?? COLORS.gold) : lineColor)
      .attr('stroke-width', d => d.isSothebys ? 2.5 : 1.5)
      .attr('stroke-dasharray', d => d.isSothebys ? 'none' : '3,3');

    // Circles
    g.selectAll('circle.dot')
      .data(data)
      .join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.value))
      .attr('cy', d => (yScale(d.name) ?? 0) + barH / 2)
      .attr('r', d => d.isSothebys ? (mode === 'branded' ? 8 : 10) : (mode === 'branded' ? 5 : 6))
      .attr('fill', d => d.isSothebys ? 'url(#lollipop-rlsir)' : compColor)
      .attr('stroke', d => d.isSothebys ? (palette?.accent ?? COLORS.gold) : 'none')
      .attr('stroke-width', d => d.isSothebys ? 1.5 : 0);

    // Y-axis labels
    g.selectAll('text.label')
      .data(data)
      .join('text')
      .attr('class', 'label')
      .attr('x', -8)
      .attr('y', d => (yScale(d.name) ?? 0) + barH / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-family', bodyFont)
      .attr('font-size', labelSize)
      .attr('font-weight', d => d.isSothebys ? '600' : '400')
      .attr('fill', () => {
        if (darkBg) return '#d1d5db';
        return mode === 'preview' ? '#d1d5db' : '#1f2937';
      })
      .text(d => {
        const maxLen = mode === 'branded' ? 22 : 18;
        return d.name.length > maxLen ? d.name.slice(0, maxLen - 1) + '\u2026' : d.name;
      });

    // Value labels
    g.selectAll('text.value')
      .data(data)
      .join('text')
      .attr('class', 'value')
      .attr('x', d => xScale(d.value) + (d.isSothebys ? 16 : 12))
      .attr('y', d => (yScale(d.name) ?? 0) + barH / 2)
      .attr('dy', '0.35em')
      .attr('font-family', bodyFont)
      .attr('font-size', mode === 'branded' ? 10 : 12)
      .attr('font-weight', 'bold')
      .attr('fill', d => {
        if (d.isSothebys) return palette?.accent ?? COLORS.gold;
        if (darkBg) return '#e5e7eb';
        return mode === 'preview' ? '#e5e7eb' : '#1f2937';
      })
      .text(d => `${d.value.toFixed(1)}%`);

  }, [data, shareType, mode, darkBg, palette, gradient, fontHeading, fontBody]);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ minHeight: mode === 'export' ? 500 : undefined }} />
  );
}
