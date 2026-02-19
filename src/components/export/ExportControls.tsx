import { useState } from 'react';
import { Download, Image, FileText, Package, AlertTriangle } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import type { ExportFormat } from '@/types';
import { DEVELOPER_CONTACT } from '@/lib/constants';
import { exportBatchReports } from './ExportRenderer';

export function ExportControls() {
  const {
    selectedIds, getSelectedMarkets, exportFormat, setExportFormat,
    isExporting, setIsExporting, setExportProgress, markets, shareType,
    visualization, showKPI, showSummary, pageTheme,
  } = useMarketStore();
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMarkets = getSelectedMarkets();
  const hasWarnings = selectedMarkets.some(m => m.status === 'warning');

  const formatOptions: { id: ExportFormat; icon: React.ReactNode; label: string }[] = [
    { id: 'png', icon: <Image size={12} />, label: 'PNG' },
    { id: 'pdf', icon: <FileText size={12} />, label: 'PDF' },
    { id: 'both', icon: <Package size={12} />, label: 'Both' },
  ];

  if (markets.length === 0) return null;

  const runExport = async () => {
    setError(null);
    setIsExporting(true);
    setExportProgress(0);

    try {
      const readyMarkets = selectedMarkets.filter(
        m => m.status !== 'error' && m.availableViews.length > 0
      );

      if (readyMarkets.length === 0) {
        throw new Error('No exportable markets selected');
      }

      await exportBatchReports(
        readyMarkets,
        shareType,
        exportFormat,
        (current, total) => setExportProgress(Math.round((current / total) * 100)),
        { visualization, showKPI, showSummary, pageTheme },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(`${msg}. ${DEVELOPER_CONTACT.action}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleExport = () => {
    if (hasWarnings && !showWarning) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    runExport();
  };

  return (
    <div className="border-t border-navy-medium p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-gray-muted font-semibold">
          Export
        </span>
        <span className="text-[10px] text-gray-muted">
          {selectedIds.size} file{selectedIds.size !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Format selector */}
      <div className="flex items-center gap-1">
        {formatOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setExportFormat(opt.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all
              ${exportFormat === opt.id
                ? 'bg-gold/15 text-gold border border-gold/20'
                : 'text-gray-muted hover:text-cream bg-navy-light/50 border border-transparent hover:border-navy-medium'
              }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={selectedIds.size === 0 || isExporting}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
          bg-gold/15 text-gold hover:bg-gold/25 border border-gold/20
          disabled:opacity-40 disabled:cursor-not-allowed
          text-sm font-medium transition-all"
      >
        {isExporting ? (
          <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {isExporting
          ? 'Exporting...'
          : selectedIds.size > 1
            ? `Export ${selectedIds.size} Reports (ZIP)`
            : 'Export Report'
        }
      </button>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-3">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}

      {/* Warning dialog */}
      {showWarning && (
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="text-warning font-medium mb-1">{DEVELOPER_CONTACT.message}</p>
              <p className="text-warning/70">{DEVELOPER_CONTACT.action}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleExport}
                  className="px-2 py-1 rounded bg-warning/20 text-warning text-[10px] hover:bg-warning/30"
                >
                  Export Anyway
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-2 py-1 rounded bg-navy-light text-gray-muted text-[10px] hover:text-cream"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
