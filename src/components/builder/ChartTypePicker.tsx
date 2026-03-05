import { useBuilderStore } from '@/store/builderStore';
import { BarChart3, TrendingUp, AreaChart, Circle, PieChart, Target } from 'lucide-react';
import type { SimpleChartType } from '@/types';

const CHART_TYPES: { id: SimpleChartType; icon: React.ReactNode; label: string }[] = [
  { id: 'bar',     icon: <BarChart3 size={16} />,   label: 'Bar' },
  { id: 'line',    icon: <TrendingUp size={16} />,   label: 'Line' },
  { id: 'area',    icon: <AreaChart size={16} />,     label: 'Area' },
  { id: 'donut',   icon: <Circle size={16} />,        label: 'Donut' },
  { id: 'pie',     icon: <PieChart size={16} />,      label: 'Pie' },
  { id: 'scatter', icon: <Target size={16} />,        label: 'Scatter' },
];

export function ChartTypePicker() {
  const chartType = useBuilderStore(s => s.chartType);
  const setChartType = useBuilderStore(s => s.setChartType);

  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2 block">
        Chart Type
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            onClick={() => setChartType(ct.id)}
            className={`
              flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-medium transition-all
              ${chartType === ct.id
                ? 'bg-gold/15 text-gold border border-gold/20'
                : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
              }
            `}
          >
            {ct.icon}
            {ct.label}
          </button>
        ))}
      </div>
    </div>
  );
}
