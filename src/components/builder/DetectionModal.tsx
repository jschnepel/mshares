import { useProjectStore } from '@/store/projectStore';
import { AlertTriangle, X } from 'lucide-react';

export function DetectionModal() {
  const { open, detectedFormat } = useProjectStore(s => s.detectionModal);
  const confirmDetection = useProjectStore(s => s.confirmDetection);
  const dismissDetection = useProjectStore(s => s.dismissDetection);

  if (!open) return null;

  const formatLabel = detectedFormat === 'FH' ? 'FlexMLS (FH)' : 'ColumnType2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-deep border border-navy-medium rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={dismissDetection}
          className="absolute top-4 right-4 text-gray-muted hover:text-cream transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-gold" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-cream mb-1">Market Share Format Detected</h3>
            <p className="text-sm text-gray-muted leading-relaxed">
              This file matches the <span className="text-cream font-medium">{formatLabel}</span> market
              share format. Would you like to use the Market Share Report template instead?
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => confirmDetection(false)}
            className="px-4 py-2 rounded-lg text-sm text-gray-muted hover:text-cream bg-navy-light/40 hover:bg-navy-light/60 border border-navy-medium transition-colors"
          >
            No, use Custom Chart
          </button>
          <button
            onClick={() => confirmDetection(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-navy-deep bg-gold hover:bg-gold/90 transition-colors"
          >
            Yes, use Market Share
          </button>
        </div>
      </div>
    </div>
  );
}
