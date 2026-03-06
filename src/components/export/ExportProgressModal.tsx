import { useMarketStore } from '@/store/marketStore';
import { Loader2 } from 'lucide-react';

export function ExportProgressModal() {
  const isExporting = useMarketStore(s => s.isExporting);
  const exportProgress = useMarketStore(s => s.exportProgress);
  const exportStage = useMarketStore(s => s.exportStage);

  if (!isExporting) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-navy-deep border border-navy-medium rounded-xl shadow-2xl p-6 w-80 text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <Loader2 size={32} className="text-gold animate-spin" />
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg text-cream mb-1">Exporting Reports</h3>

        {/* Stage description */}
        <p className="text-[11px] text-gray-muted mb-4">
          {exportStage || 'Preparing...'}
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-navy-light rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(exportProgress, 5)}%` }}
          />
        </div>

        {/* Percentage */}
        <p className="text-[10px] text-gold/60 mt-2">
          {exportProgress}%
        </p>
      </div>
    </div>
  );
}
