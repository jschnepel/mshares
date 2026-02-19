import { useMemo, useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import type { MarketData, ShareType } from '@/types';
import { COLORS, FONT_SCALE, MAX_BROKERAGES_PREVIEW, CHART_EXPORT } from '@/lib/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface MarketShareBarProps {
  market: MarketData;
  shareType: ShareType;
  maxBrokerages?: number;
  /** preview = dark app view, export = offscreen canvas capture, branded = template-style preview */
  mode?: 'preview' | 'export' | 'branded';
  /** When true, use light-on-dark colors (for dark page themes) */
  darkBg?: boolean;
}

export function MarketShareBar({ market, shareType, maxBrokerages, mode = 'preview', darkBg = false }: MarketShareBarProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const max = maxBrokerages ?? MAX_BROKERAGES_PREVIEW;

  // Cleanup chart on unmount to prevent "Canvas already in use" error
  useEffect(() => {
    return () => { chartRef.current?.destroy(); };
  }, []);

  // "branded" uses preview font sizes but export visual style
  const isClean = mode === 'export' || mode === 'branded'; // no title, no x-axis, square bars
  const fonts = mode === 'export' ? FONT_SCALE.export : FONT_SCALE.preview;

  const { labels, values, colors, borderColors, sothebysIdx } = useMemo(() => {
    const sorted = [...market.brokerages].sort((a, b) =>
      shareType === 'dollar'
        ? b.marketShareDollar - a.marketShareDollar
        : b.marketShareUnits - a.marketShareUnits
    );

    const top = sorted.slice(0, max);
    const competitorCount = top.filter(b => !b.isSothebys).length;
    let cIdx = 0;

    return {
      labels: top.map(b => {
        const name = b.name;
        // Wrap long names for y-axis
        if (name.length > 28) {
          const mid = Math.ceil(name.length / 2);
          const spaceIdx = name.indexOf(' ', mid - 5);
          if (spaceIdx > 0 && spaceIdx < name.length - 3) {
            return [name.slice(0, spaceIdx), name.slice(spaceIdx + 1)];
          }
        }
        return name;
      }),
      values: top.map(b => shareType === 'dollar' ? b.marketShareDollar : b.marketShareUnits),
      colors: top.map(b => {
        if (b.isSothebys) return darkBg ? COLORS.gold : COLORS.navy;
        // Graduated competitor colors — higher rank = more prominent
        const t = competitorCount > 1 ? cIdx / (competitorCount - 1) : 0;
        cIdx++;
        if (darkBg) {
          return `rgba(255,255,255,${0.45 - t * 0.22})`;
        }
        if (mode === 'preview') return COLORS.grayBar;
        const gray = Math.round(130 + t * 55);
        return `rgb(${gray},${gray},${gray})`;
      }),
      borderColors: top.map(b => b.isSothebys
        ? (darkBg ? COLORS.gold : COLORS.navy)
        : 'transparent'),
      sothebysIdx: top.findIndex(b => b.isSothebys),
    };
  }, [market, shareType, max, darkBg, mode]);

  // RLSIR gradient plugin — creates a horizontal gradient on the Sotheby's bar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradientPlugin = useMemo(() => ({
    id: 'rlsirGradient',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterLayout(chart: any) {
      if (mode !== 'branded' || sothebysIdx < 0) return;
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
      if (darkBg) {
        gradient.addColorStop(0, '#9e8a64');
        gradient.addColorStop(0.6, COLORS.gold);
        gradient.addColorStop(1, '#d4c4a0');
      } else {
        gradient.addColorStop(0, '#001530');
        gradient.addColorStop(0.5, COLORS.navy);
        gradient.addColorStop(1, '#1a5276');
      }

      const ds = chart.data.datasets[0];
      if (ds?.backgroundColor) {
        (ds.backgroundColor as unknown[])[sothebysIdx] = gradient;
      }
    }
  }), [mode, darkBg, sothebysIdx]);

  // Trigger bar animation on data change
  useEffect(() => {
    chartRef.current?.update('active');
  }, [market.id, shareType]);

  const chartTitle = shareType === 'dollar' ? 'Market Share ($)' : 'Market Share (#)';

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 0,
      borderRadius: isClean ? 4 : 6,
      borderSkipped: false as const,
      barPercentage: mode === 'branded' ? 0.72 : (isClean ? 0.78 : 0.75),
      categoryPercentage: mode === 'branded' ? 0.82 : (isClean ? 0.88 : 0.85),
    }],
  };

  // Pre-compute sorted list for datalabel callbacks
  const sorted = useMemo(() =>
    [...market.brokerages].sort((a, b) =>
      shareType === 'dollar'
        ? b.marketShareDollar - a.marketShareDollar
        : b.marketShareUnits - a.marketShareUnits
    ).slice(0, max),
  [market, shareType, max]);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: mode === 'export' ? 0 : 800,
      easing: 'easeOutQuart' as const,
    },
    layout: {
      padding: {
        right: isClean ? 60 : 50,
        left: isClean ? 10 : 5,
        top: 10,
        bottom: 10,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        display: !isClean,
        grid: {
          color: 'rgba(255,255,255,0.06)',
          drawBorder: false,
        },
        ticks: {
          font: { size: fonts.ticks, family: 'Inter' },
          color: '#9ca3af',
          callback: (val: string | number) => `${val}%`,
        },
        title: {
          display: false,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          autoSkip: false,
          font: { size: mode === 'branded' ? 9 : fonts.ticks, family: 'Inter', weight: '500' as const },
          color: isClean ? (darkBg ? '#d1d5db' : '#1f2937') : '#d1d5db',
          crossAlign: 'far' as const,
          padding: isClean ? 8 : 8,
        },
      },
    },
    plugins: {
      legend: { display: false },
      title: {
        display: !isClean,
        text: chartTitle,
        font: {
          size: fonts.title,
          family: 'Playfair Display',
          weight: 'bold' as const,
        },
        color: COLORS.cream,
        padding: { bottom: 20 },
      },
      tooltip: {
        enabled: !isClean,
        backgroundColor: COLORS.navy,
        titleFont: { family: 'Inter', weight: '600' as const },
        bodyFont: { family: 'Inter' },
        borderColor: COLORS.gold,
        borderWidth: 1,
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${Number(ctx.raw).toFixed(1)}%`,
        },
      },
      datalabels: {
        formatter: (val: number) => `${val.toFixed(1)}%`,
        font: {
          size: mode === 'branded' ? 10 : fonts.datalabels,
          family: 'Inter',
          weight: 'bold' as const,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        color: (ctx: any) => {
          const b = sorted[ctx.dataIndex];
          return b?.isSothebys ? COLORS.white : (isClean ? (darkBg ? '#e5e7eb' : '#1f2937') : '#e5e7eb');
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anchor: (ctx: any) => {
          const b = sorted[ctx.dataIndex];
          return b?.isSothebys ? 'center' : 'end';
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        align: (ctx: any) => {
          const b = sorted[ctx.dataIndex];
          return b?.isSothebys ? 'center' : 'right';
        },
        offset: 6,
      },
    },
  };

  return (
    <div
      className={mode === 'export' ? '' : 'h-full w-full'}
      style={mode === 'export' ? { width: `${CHART_EXPORT.width}px`, height: `${CHART_EXPORT.height}px` } : undefined}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Bar ref={chartRef} data={data} options={options as any} plugins={[gradientPlugin]} />
    </div>
  );
}
