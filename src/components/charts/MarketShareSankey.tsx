import { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { MarketData, ShareType } from '@/types';
import { COLORS, MAX_BROKERAGES_PREVIEW } from '@/lib/constants';

interface SankeyProps {
  market: MarketData;
  shareType: ShareType;
  maxBrokerages?: number;
  mode?: 'preview' | 'export' | 'branded';
  darkBg?: boolean;
}

export function MarketShareSankey({ market, shareType, maxBrokerages, mode = 'preview', darkBg = false }: SankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const max = maxBrokerages ?? MAX_BROKERAGES_PREVIEW;

  const graphData = useMemo(() => {
    const sorted = [...market.brokerages].sort((a, b) =>
      shareType === 'dollar'
        ? b.marketShareDollar - a.marketShareDollar
        : b.marketShareUnits - a.marketShareUnits
    );
    const top = sorted.slice(0, max);
    const topTotal = top.reduce((s, b) =>
      s + (shareType === 'dollar' ? b.marketShareDollar : b.marketShareUnits), 0);
    const otherShare = Math.max(0, 100 - topTotal);

    const nodes: { name: string; isSothebys: boolean }[] = [
      { name: 'Total Market', isSothebys: false },
      ...top.map(b => ({ name: b.name, isSothebys: b.isSothebys })),
    ];
    if (otherShare > 0.5) {
      nodes.push({ name: 'Other', isSothebys: false });
    }

    const links: { source: number; target: number; value: number }[] = top.map((b, i) => ({
      source: 0,
      target: i + 1,
      value: shareType === 'dollar' ? b.marketShareDollar : b.marketShareUnits,
    }));
    if (otherShare > 0.5) {
      links.push({ source: 0, target: nodes.length - 1, value: otherShare });
    }

    return { nodes, links };
  }, [market, shareType, max]);

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 700;
    const height = svgRef.current.clientHeight || 450;
    const lightText = darkBg || mode === 'preview';
    const titleColor = lightText ? COLORS.cream : COLORS.navy;
    const titleSize = mode === 'export' ? 26 : 14;

    // ── SVG defs for gradients ──
    const defs = svg.append('defs');

    // RLSIR node gradient
    const nodeGrad = defs.append('linearGradient')
      .attr('id', 'sankey-rlsir-node')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    // Same navy gradient for RLSIR node in both themes
    nodeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1a5276');
    nodeGrad.append('stop').attr('offset', '100%').attr('stop-color', COLORS.navy);

    // Title
    svg.append('text')
      .attr('x', width / 2).attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Playfair Display')
      .attr('font-size', titleSize)
      .attr('font-weight', '600')
      .attr('fill', titleColor)
      .text(shareType === 'dollar' ? 'Market Share Flow ($)' : 'Market Share Flow (#)');

    const labelSize = mode === 'export' ? 13 : mode === 'branded' ? 8 : 11;
    const rightMargin = mode === 'branded' ? 210 : 160;
    const margin = { top: 35, right: rightMargin, bottom: 10, left: 12 };

    const sankeyGen = d3Sankey()
      .nodeWidth(20)
      .nodePadding(12)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graph = sankeyGen(graphData as any);
    const g = svg.append('g');

    // Create gradient defs for RLSIR links (horizontal, from source to target)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (graph.links as any[]).forEach((link: any, i: number) => {
      if (!link.target?.isSothebys) return;
      const grad = defs.append('linearGradient')
        .attr('id', `sankey-link-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source?.x1 ?? 0)
        .attr('x2', link.target?.x0 ?? 0);
      // Same navy-to-gold gradient for RLSIR links in both themes
      grad.append('stop').attr('offset', '0%').attr('stop-color', COLORS.navy).attr('stop-opacity', darkBg ? 0.4 : 0.2);
      grad.append('stop').attr('offset', '100%').attr('stop-color', COLORS.gold).attr('stop-opacity', 0.7);
    });

    // Links
    g.selectAll('path')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(graph.links as any[])
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any, i: number) => {
        if (d.target?.isSothebys) return `url(#sankey-link-${i})`;
        return darkBg ? 'rgba(209,213,219,0.18)' : (mode === 'preview' ? 'rgba(255,255,255,0.12)' : '#d1d5db');
      })
      .attr('stroke-width', (d: any) => Math.max(1, d.width ?? 1))
      .attr('fill', 'none')
      .attr('opacity', (d: any) => d.target?.isSothebys ? 1 : 0.3);

    // Nodes
    g.selectAll('rect')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(graph.nodes as any[])
      .join('rect')
      .attr('x', (d: any) => d.x0 ?? 0)
      .attr('y', (d: any) => d.y0 ?? 0)
      .attr('width', (d: any) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d: any) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d: any) => {
        if (d.name === 'Total Market') return darkBg ? '#1a5276' : COLORS.navy;
        if (d.isSothebys) return 'url(#sankey-rlsir-node)';
        return COLORS.grayBar;
      })
      .attr('rx', 3)
      .attr('stroke', (d: any) => d.isSothebys ? COLORS.gold : 'none')
      .attr('stroke-width', (d: any) => d.isSothebys ? 1 : 0);

    // Labels
    g.selectAll('text.label')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .data(graph.nodes as any[])
      .join('text')
      .attr('class', 'label')
      .attr('x', (d: any) => (d.x1 ?? 0) + 8)
      .attr('y', (d: any) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('font-family', 'Inter')
      .attr('font-size', labelSize)
      .attr('font-weight', (d: any) => d.isSothebys ? '600' : '400')
      .attr('fill', (d: any) => {
        if (d.isSothebys) return darkBg ? COLORS.gold : COLORS.navy;
        if (darkBg) return '#9ca3af';
        return mode === 'preview' ? '#d1d5db' : '#4b5563';
      })
      .text((d: any) => {
        if (d.name === 'Total Market') return '100%';
        return `${d.name ?? ''} (${(d.value ?? 0).toFixed(1)}%)`;
      });
  }, [graphData, shareType, mode, darkBg]);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ minHeight: mode === 'export' ? 500 : undefined }} />
  );
}
