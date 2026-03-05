import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Doughnut, Pie, Scatter } from 'react-chartjs-2';
import type { SimpleChartType, ColumnDataType } from '@/types';
import type { SimpleChartData } from '@/store/builderStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend, ChartDataLabels);

// Base64-encoded logos (same as ChartView.tsx)
const EQUAL_HOUSING = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0iI2ZmZmZmZiI+CiAgPHBhdGggZD0iTTQwIDVMNSAzNWgxMHYzNWg1MFYzNWgxMEw0MCA1em0tMTUgNjBWMzhoMzB2MjdIMjV6Ii8+CiAgPHJlY3QgeD0iMzAiIHk9IjQ0IiB3aWR0aD0iMjAiIGhlaWdodD0iMyIvPgogIDxyZWN0IHg9IjMwIiB5PSI1MSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjMiLz4KICA8dGV4dCB4PSI0MCIgeT0iNzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+RVFVQUwgSE9VU0lORzwvdGV4dD4KICA8dGV4dCB4PSI0MCIgeT0iODIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNSIgZm9udC1mYW1pbHk9IkFyaWFsIj5PUFBPUlRVTklUWTwvdGV4dD4KPC9zdmc+';
const REALTOR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA3MCIgZmlsbD0iI2ZmZmZmZiI+CiAgPHJlY3QgeD0iNSIgeT0iNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIzMCIgeT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzIiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiPlI8L3RleHQ+CiAgPHRleHQgeD0iMzAiIHk9IjY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC13ZWlnaHQ9ImJvbGQiIGxldHRlci1zcGFjaW5nPSIxIj5SRUFMVE9Swq48L3RleHQ+Cjwvc3ZnPg==';

const DEFAULT_SERIES_COLORS = ['#002349', '#BFA67A', '#6b7f94', '#9ca3af', '#e5a855', '#7c9eb8'];

function svgToPng(svgDataUrl: string, w: number, h: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

export interface BrandedChartPageProps {
  chartData: SimpleChartData;
  chartType: SimpleChartType;
  chartTitle: string;
  valueColumns: number[];
  seriesColors: Record<number, string>;
  showDataLabels: boolean;
  showLegend: boolean;
  bgColor: string;
}

export function BrandedChartPage({
  chartData,
  chartType,
  chartTitle,
  valueColumns,
  seriesColors,
  showDataLabels,
  showLegend,
}: BrandedChartPageProps) {
  const [pngLogos, setPngLogos] = useState({ eq: EQUAL_HOUSING, re: REALTOR });
  useEffect(() => {
    Promise.all([
      svgToPng(EQUAL_HOUSING, 160, 160),
      svgToPng(REALTOR, 120, 140),
    ]).then(([eq, re]) => setPngLogos({ eq, re }));
  }, []);

  const colors = valueColumns.map((colIdx, i) =>
    seriesColors[colIdx] ?? DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]
  );
  const sliceColors = chartData.labels.map((_, i) => DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]);

  const textColor = '#d1d5db';
  const gridColor = 'rgba(255,255,255,0.06)';

  const datalabelPlugin = {
    display: showDataLabels,
    color: '#e5e7eb',
    font: { size: 9, weight: 'bold' as const },
    formatter: (val: number) => {
      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
      return val % 1 !== 0 ? val.toFixed(1) : String(val);
    },
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        display: showLegend && chartData.datasets.length > 1,
        labels: { color: textColor, font: { size: 9 } },
      },
      datalabels: datalabelPlugin,
    },
  };

  function renderChart() {
    if (chartType === 'bar') {
      return (
        <Bar
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds, i) => ({
              label: ds.name,
              data: ds.values,
              backgroundColor: colors[i],
              borderRadius: 3,
              barPercentage: 0.75,
              categoryPercentage: 0.85,
            })),
          }}
          options={{
            ...baseOptions,
            indexAxis: 'y' as const,
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
              y: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } },
            },
          }}
        />
      );
    }

    if (chartType === 'line' || chartType === 'area') {
      return (
        <Line
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets.map((ds, i) => ({
              label: ds.name,
              data: ds.values,
              borderColor: colors[i],
              backgroundColor: chartType === 'area' ? `${colors[i]}33` : colors[i],
              fill: chartType === 'area',
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: colors[i],
            })),
          }}
          options={{
            ...baseOptions,
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { size: 8 } } },
              y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
            },
          }}
        />
      );
    }

    if (chartType === 'donut' || chartType === 'pie') {
      const ds = chartData.datasets[0];
      if (!ds) return null;
      const data = {
        labels: chartData.labels,
        datasets: [{
          data: ds.values,
          backgroundColor: sliceColors,
          borderWidth: 2,
          borderColor: '#0a1628',
        }],
      };
      const ChartComp = chartType === 'donut' ? Doughnut : Pie;
      return (
        <ChartComp
          data={data}
          options={{
            ...baseOptions,
            cutout: chartType === 'donut' ? '55%' : undefined,
            plugins: {
              ...baseOptions.plugins,
              legend: { display: showLegend, position: 'right' as const, labels: { color: textColor, font: { size: 9 }, padding: 8 } },
              datalabels: {
                ...datalabelPlugin,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter: (val: number, ctx: any) => {
                  const total = (ctx.dataset.data as number[]).reduce((s: number, v: number) => s + v, 0);
                  return total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '';
                },
              },
            },
          }}
        />
      );
    }

    if (chartType === 'scatter') {
      const ds0 = chartData.datasets[0];
      const ds1 = chartData.datasets[1];
      if (!ds0 || !ds1) return null;
      return (
        <Scatter
          data={{
            datasets: [{
              label: `${ds0.name} vs ${ds1.name}`,
              data: ds0.values.map((x, i) => ({ x, y: ds1.values[i] ?? 0 })),
              backgroundColor: colors[0] ?? '#002349',
              pointRadius: 4,
            }],
          }}
          options={{
            ...baseOptions,
            scales: {
              x: { title: { display: true, text: ds0.name, color: textColor, font: { size: 8 } }, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
              y: { title: { display: true, text: ds1.name, color: textColor, font: { size: 8 } }, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
            },
            plugins: { ...baseOptions.plugins, datalabels: { display: false } },
          }}
        />
      );
    }

    return null;
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ width: 600, height: 776, backgroundColor: '#0a1628' }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex flex-col items-center justify-center px-8"
        style={{
          flex: '0 0 20%',
          background: 'linear-gradient(135deg, #002349 0%, #0a1628 60%, #1a1006 100%)',
        }}
      >
        <h1
          className="text-white text-center font-bold uppercase"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            lineHeight: 1.2,
            letterSpacing: '0.02em',
          }}
        >
          {chartTitle || 'Custom Chart'}
        </h1>
        <div style={{ width: 48, height: 2, backgroundColor: '#BFA67A', marginTop: 10, opacity: 0.8 }} />
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 px-6 py-4">
        <div className="w-full h-full">
          {renderChart()}
        </div>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ borderTop: '2px solid #BFA67A' }}
      >
        <div className="flex items-center gap-2">
          <img src={pngLogos.eq} alt="Equal Housing" style={{ height: 18, opacity: 0.5 }} />
          <img src={pngLogos.re} alt="Realtor" style={{ height: 16, opacity: 0.5 }} />
        </div>
        <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)', maxWidth: '65%', textAlign: 'right', lineHeight: 1.3 }}>
          Data compiled by Russ Lyon Sotheby's International Realty
        </p>
      </div>
    </div>
  );
}
