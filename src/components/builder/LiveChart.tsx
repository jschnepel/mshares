import { useMemo } from 'react';
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
import { useBuilderStore } from '@/store/builderStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend, ChartDataLabels);

const DEFAULT_SERIES_COLORS = ['#002349', '#BFA67A', '#6b7f94', '#9ca3af', '#e5a855', '#7c9eb8'];

export function LiveChart() {
  const chartData = useBuilderStore(s => s.getChartData());
  const chartType = useBuilderStore(s => s.chartType);
  const labelColumn = useBuilderStore(s => s.labelColumn);
  const valueColumns = useBuilderStore(s => s.valueColumns);
  const seriesColors = useBuilderStore(s => s.seriesColors);
  const showDataLabels = useBuilderStore(s => s.showDataLabels);
  const showLegend = useBuilderStore(s => s.showLegend);
  const bgColor = useBuilderStore(s => s.bgColor);

  // Resolve colors per dataset/slice
  const colors = useMemo(() =>
    valueColumns.map((colIdx, i) =>
      seriesColors[colIdx] ?? DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]
    ), [valueColumns, seriesColors]);

  // For pie/donut, we want per-slice colors
  const sliceColors = useMemo(() =>
    chartData.labels.map((_, i) => DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length]),
    [chartData.labels]);

  // Empty states
  if (labelColumn === null) {
    return <EmptyState message="Select a label column to get started" />;
  }
  if (valueColumns.length === 0) {
    return <EmptyState message="Select at least one value column" />;
  }
  if (chartType === 'scatter' && valueColumns.length < 2) {
    return <EmptyState message="Scatter chart needs 2 value columns (X and Y)" />;
  }
  if (chartData.labels.length === 0) {
    return <EmptyState message="No data to display" />;
  }

  const textColor = '#d1d5db';
  const gridColor = 'rgba(255,255,255,0.06)';

  const datalabelPlugin = {
    display: showDataLabels,
    color: '#e5e7eb',
    font: { size: 10, weight: 'bold' as const },
    formatter: (val: number) => {
      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
      return val % 1 !== 0 ? val.toFixed(1) : String(val);
    },
  };

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        display: showLegend && chartData.datasets.length > 1,
        labels: { color: textColor, font: { size: 11 } },
      },
      datalabels: datalabelPlugin,
    },
  };

  const containerStyle = {
    backgroundColor: bgColor === 'transparent' ? undefined : bgColor,
  };

  if (chartType === 'bar') {
    const data = {
      labels: chartData.labels,
      datasets: chartData.datasets.map((ds, i) => ({
        label: ds.name,
        data: ds.values,
        backgroundColor: colors[i],
        borderRadius: 4,
        barPercentage: 0.75,
        categoryPercentage: 0.85,
      })),
    };
    return (
      <div className="w-full h-full" style={containerStyle}>
        <Bar data={data} options={{
          ...baseOptions,
          indexAxis: 'y' as const,
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          },
        }} />
      </div>
    );
  }

  if (chartType === 'line' || chartType === 'area') {
    const data = {
      labels: chartData.labels,
      datasets: chartData.datasets.map((ds, i) => ({
        label: ds.name,
        data: ds.values,
        borderColor: colors[i],
        backgroundColor: chartType === 'area' ? `${colors[i]}33` : colors[i],
        fill: chartType === 'area',
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: colors[i],
      })),
    };
    return (
      <div className="w-full h-full" style={containerStyle}>
        <Line data={data} options={{
          ...baseOptions,
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          },
        }} />
      </div>
    );
  }

  if (chartType === 'donut' || chartType === 'pie') {
    const ds = chartData.datasets[0];
    if (!ds) return <EmptyState message="No data" />;
    const data = {
      labels: chartData.labels,
      datasets: [{
        data: ds.values,
        backgroundColor: sliceColors,
        borderWidth: 2,
        borderColor: bgColor === 'transparent' ? '#0a1628' : bgColor,
      }],
    };
    const opts = {
      ...baseOptions,
      cutout: chartType === 'donut' ? '55%' : undefined,
      plugins: {
        ...baseOptions.plugins,
        legend: { display: showLegend, position: 'right' as const, labels: { color: textColor, font: { size: 11 }, padding: 12 } },
        datalabels: {
          ...datalabelPlugin,
          formatter: (val: number, ctx: { dataset: { data: number[] } }) => {
            const total = ctx.dataset.data.reduce((s: number, v: number) => s + v, 0);
            return total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '';
          },
        },
      },
    };
    return (
      <div className="w-full h-full flex items-center justify-center" style={containerStyle}>
        {chartType === 'donut'
          ? <Doughnut data={data} options={opts} />
          : <Pie data={data} options={opts} />
        }
      </div>
    );
  }

  if (chartType === 'scatter') {
    const ds0 = chartData.datasets[0];
    const ds1 = chartData.datasets[1];
    if (!ds0 || !ds1) return <EmptyState message="Scatter needs 2 value columns" />;
    const data = {
      datasets: [{
        label: `${ds0.name} vs ${ds1.name}`,
        data: ds0.values.map((x, i) => ({ x, y: ds1.values[i] ?? 0 })),
        backgroundColor: colors[0] ?? '#002349',
        pointRadius: 5,
      }],
    };
    return (
      <div className="w-full h-full" style={containerStyle}>
        <Scatter data={data} options={{
          ...baseOptions,
          scales: {
            x: { title: { display: true, text: ds0.name, color: textColor }, grid: { color: gridColor }, ticks: { color: textColor } },
            y: { title: { display: true, text: ds1.name, color: textColor }, grid: { color: gridColor }, ticks: { color: textColor } },
          },
          plugins: {
            ...baseOptions.plugins,
            datalabels: { display: false },
          },
        }} />
      </div>
    );
  }

  return <EmptyState message="Unsupported chart type" />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-gray-muted text-sm">{message}</p>
    </div>
  );
}
