import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { MarketData, ShareType } from '@/types';
import { generateExecutiveSummary } from '@/lib/summaryGenerator';

interface ExecutiveSummaryProps {
  market: MarketData;
  shareType: ShareType;
}

export function ExecutiveSummary({ market, shareType }: ExecutiveSummaryProps) {
  const summary = useMemo(
    () => generateExecutiveSummary(market, shareType),
    [market, shareType]
  );

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} className="text-gold" />
        <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">
          Executive Summary
        </span>
      </div>
      <p className="text-cream/80 text-sm leading-relaxed">
        {summary}
      </p>
    </div>
  );
}

export function ExecutiveSummarySkeleton() {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-3.5 h-3.5 rounded" />
        <div className="skeleton w-28 h-2.5" />
      </div>
      <div className="space-y-2">
        <div className="skeleton w-full h-3" />
        <div className="skeleton w-full h-3" />
        <div className="skeleton w-3/4 h-3" />
      </div>
    </div>
  );
}
