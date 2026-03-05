import type { MarketData, KPILayout } from '@/types';
import { DollarSign, Home, Clock, Ruler, Target, TrendingUp } from 'lucide-react';

function formatDollar(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

interface KPICardsProps {
  market: MarketData;
  layout?: KPILayout;
}

const GRID_CLASS: Record<KPILayout, string> = {
  'grid-3col': 'grid grid-cols-3 gap-3',
  'grid-2col': 'grid grid-cols-2 gap-3',
  'horizontal-strip': 'flex gap-2 overflow-x-auto',
  'card-stack': 'flex flex-col gap-2',
};

export function KPICards({ market, layout = 'grid-3col' }: KPICardsProps) {
  const s = market.sothebysData;
  if (!s) return null;

  const cards = [
    { icon: <DollarSign size={18} />, label: 'Dollar Volume', value: formatDollar(s.dollarVolume), highlight: true },
    { icon: <Home size={18} />, label: 'Total Sales', value: Math.round(s.totalSales).toLocaleString(), highlight: false },
    { icon: <TrendingUp size={18} />, label: 'Avg Sale Price', value: formatDollar(s.avgPrice), highlight: true },
    { icon: <Clock size={18} />, label: 'Days on Market', value: s.daysOnMarket > 0 ? `${Math.round(s.daysOnMarket)}` : '—', highlight: false },
    { icon: <Ruler size={18} />, label: 'Price / SqFt', value: s.pricePerSqFt > 0 ? `$${Math.round(s.pricePerSqFt)}` : '—', highlight: false },
    { icon: <Target size={18} />, label: 'SP / LP Ratio', value: s.saleToListRatio > 0 ? `${(s.saleToListRatio * 100).toFixed(1)}%` : '—', highlight: false },
  ];

  const isStrip = layout === 'horizontal-strip';
  const isStack = layout === 'card-stack';

  return (
    <div className={GRID_CLASS[layout]}>
      {cards.map(card => (
        <div
          key={card.label}
          className={`glass rounded-lg p-3 ${isStrip ? 'min-w-[120px] flex flex-col items-center text-center gap-1' : isStack ? 'flex items-center gap-4' : 'flex items-start gap-3'}`}
        >
          <div className={`${isStrip ? '' : 'mt-0.5'} ${card.highlight ? 'text-gold' : 'text-gray-muted'}`}>
            {card.icon}
          </div>
          <div className={isStack ? 'flex items-center gap-4 flex-1' : ''}>
            <div className="text-[10px] uppercase tracking-widest text-gray-muted mb-0.5">
              {card.label}
            </div>
            <div className={`${isStack ? 'text-xl' : 'text-lg'} font-semibold ${card.highlight ? 'text-gold' : 'text-cream'}`}>
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-lg p-3 flex items-start gap-3">
          <div className="skeleton w-5 h-5 rounded mt-0.5" />
          <div>
            <div className="skeleton w-16 h-2.5 mb-2" />
            <div className="skeleton w-20 h-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
