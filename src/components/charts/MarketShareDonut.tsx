import { useMemo, useRef, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';
import type { MarketData, ShareType, ColorPalette, GradientConfig } from '@/types';
import { COLORS, MAX_BROKERAGES_PREVIEW } from '@/lib/constants';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface DonutProps {
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

export function MarketShareDonut({ market, shareType, maxBrokerages, mode = 'preview', darkBg = false, palette, fontBody }: DonutProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);
  const max = maxBrokerages ?? MAX_BROKERAGES_PREVIEW;
  const isClean = mode === 'export' || mode === 'branded';

  useEffect(() => {
    return () => { chartRef.current?.destroy(); };
  }, []);

  const { labels, values, colors, sothebysShare } = useMemo(() => {
    const sorted = [...market.brokerages].sort((a, b) =>
      shareType === 'dollar'
        ? b.marketShareDollar - a.marketShareDollar
        : b.marketShareUnits - a.marketShareUnits
    );
    const top = sorted.slice(0, max);
    const competitorCount = top.filter(b => !b.isSothebys).length;
    let cIdx = 0;
    const sData = top.find(b => b.isSothebys);

    return {
      labels: top.map(b => b.name),
      values: top.map(b => shareType === 'dollar' ? b.marketShareDollar : b.marketShareUnits),
      colors: top.map(b => {
        if (b.isSothebys) return darkBg ? (palette?.rlsirSecondary ?? COLORS.gold) : (palette?.rlsirPrimary ?? COLORS.navy);
        const t = competitorCount > 1 ? cIdx / (competitorCount - 1) : 0;
        cIdx++;
        if (darkBg) return `rgba(255,255,255,${0.45 - t * 0.22})`;
        const gray = Math.round(130 + t * 55);
        return `rgb(${gray},${gray},${gray})`;
      }),
      sothebysShare: sData ? (shareType === 'dollar' ? sData.marketShareDollar : sData.marketShareUnits) : 0,
    };
  }, [market, shareType, max, darkBg, palette]);

  // Center label plugin
  const centerLabelPlugin = useMemo(() => ({
    id: 'centerLabel',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDraw(chart: any) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
      const fontSize = Math.round(radius * 0.28);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Percentage
      ctx.font = `bold ${fontSize}px ${fontBody ?? 'Inter'}`;
      ctx.fillStyle = darkBg ? COLORS.cream : (isClean ? COLORS.navy : COLORS.cream);
      ctx.fillText(`${sothebysShare.toFixed(1)}%`, cx, cy - fontSize * 0.25);

      // Sub-label
      ctx.font = `500 ${Math.round(fontSize * 0.35)}px ${fontBody ?? 'Inter'}`;
      ctx.fillStyle = darkBg ? 'rgba(255,255,255,0.5)' : (isClean ? '#6b7280' : '#9ca3af');
      ctx.fillText('RLSIR', cx, cy + fontSize * 0.5);

      ctx.restore();
    }
  }), [sothebysShare, darkBg, isClean, fontBody]);

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: darkBg ? COLORS.navy : (isClean ? '#ffffff' : COLORS.navyDeep),
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    animation: {
      duration: mode === 'export' ? 0 : 800,
    },
    layout: {
      padding: mode === 'branded' ? 10 : 20,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !isClean,
        backgroundColor: COLORS.navy,
        titleFont: { family: fontBody ?? 'Inter', weight: '600' as const },
        bodyFont: { family: fontBody ?? 'Inter' },
        borderColor: COLORS.gold,
        borderWidth: 1,
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => ` ${ctx.label}: ${Number(ctx.raw).toFixed(1)}%`,
        },
      },
      datalabels: {
        display: (ctx: { dataIndex: number }) => values[ctx.dataIndex] >= 3,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        font: { size: mode === 'branded' ? 9 : 11, family: fontBody ?? 'Inter', weight: 'bold' as const },
        color: COLORS.white,
      },
    },
  };

  return (
    <div className={mode === 'export' ? '' : 'h-full w-full'}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Doughnut ref={chartRef} data={data} options={options as any} plugins={[centerLabelPlugin]} />
    </div>
  );
}
