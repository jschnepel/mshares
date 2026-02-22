import { useMarketStore } from '@/store/marketStore';
import { TrendingUp, DollarSign, Home, Clock, Ruler, Target } from 'lucide-react';

function formatDollar(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  skeleton?: boolean;
}

function Metric({ icon, label, value, highlight, skeleton }: MetricProps) {
  if (skeleton) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="skeleton w-4 h-4 rounded" />
        <div>
          <div className="skeleton w-12 h-3 mb-1" />
          <div className="skeleton w-16 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className={highlight ? 'text-gold' : 'text-gray-muted'}>{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gray-muted">{label}</div>
        <div className={`text-sm font-semibold ${highlight ? 'text-gold' : 'text-cream'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export function MetricRibbon() {
  const { getCurrentMarket, isProcessing, shareType } = useMarketStore();
  const market = getCurrentMarket();
  const s = market?.sothebysData;

  if (isProcessing || !market) {
    return (
      <div className="h-14 bg-navy-light/50 border-b border-navy-medium flex items-center px-2 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <Metric key={i} icon={null} label="" value="" skeleton />
        ))}
      </div>
    );
  }

  const share = shareType === 'dollar' ? s?.marketShareDollar : s?.marketShareUnits;

  return (
    <div className="h-14 bg-navy-light/50 border-b border-navy-medium flex items-center px-2 overflow-x-auto gap-1">
      <div className="flex items-center gap-1 px-3 mr-2">
        <span className="font-serif text-cream text-sm font-semibold truncate max-w-[200px]">
          {market.chartTitle ?? market.marketName}
        </span>
      </div>
      <div className="w-px h-8 bg-navy-medium" />

      <Metric
        icon={<TrendingUp size={14} />}
        label="Mkt Share"
        value={share ? `${share.toFixed(1)}%` : '—'}
        highlight
      />
      <Metric
        icon={<DollarSign size={14} />}
        label="Volume"
        value={s ? formatDollar(s.dollarVolume) : '—'}
        highlight
      />
      <Metric
        icon={<Home size={14} />}
        label="Sales"
        value={s ? Math.round(s.totalSales).toLocaleString() : '—'}
      />
      <Metric
        icon={<DollarSign size={14} />}
        label="Avg Price"
        value={s ? formatDollar(s.avgPrice) : '—'}
      />
      <Metric
        icon={<Clock size={14} />}
        label="DOM"
        value={s ? `${Math.round(s.daysOnMarket)}` : '—'}
      />
      <Metric
        icon={<Ruler size={14} />}
        label="$/SqFt"
        value={s ? `$${Math.round(s.pricePerSqFt)}` : '—'}
      />
      <Metric
        icon={<Target size={14} />}
        label="SP/LP"
        value={s && s.saleToListRatio > 0 ? `${(s.saleToListRatio * 100).toFixed(1)}%` : '—'}
      />
    </div>
  );
}
