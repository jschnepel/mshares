import { useMemo, useState } from 'react';
import { Download, Image, FileText, Package, AlertTriangle, ShieldCheck, ShieldX, ChevronDown, ChevronUp } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import type { ExportFormat } from '@/types';
import { DEVELOPER_CONTACT } from '@/lib/constants';
import { exportBatchReports } from './ExportRenderer';
import { validateBatchExport, type BatchValidationResult } from '@/lib/exportValidator';

export function ExportControls() {
  const {
    selectedIds, getSelectedMarkets, exportFormat, setExportFormat,
    isExporting, setIsExporting, setExportProgress, markets, shareType,
    visualization, showKPI, showSummary, pageTheme, heroImages, dateStart, dateEnd,
    themeConfig,
  } = useMarketStore();
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedMarkets = getSelectedMarkets();

  // Run validation on every render (it's cheap — pure data checks)
  const validation: BatchValidationResult = useMemo(() => {
    const readyMarkets = selectedMarkets.filter(
      m => m.status !== 'error' && m.availableViews.length > 0
    );
    return validateBatchExport(readyMarkets, shareType, heroImages, {
      showKPI,
      showSummary,
      dateStart,
      dateEnd,
    });
  }, [selectedMarkets, shareType, heroImages, showKPI, showSummary, dateStart, dateEnd]);

  const formatOptions: { id: ExportFormat; icon: React.ReactNode; label: string }[] = [
    { id: 'png', icon: <Image size={12} />, label: 'PNG' },
    { id: 'pdf', icon: <FileText size={12} />, label: 'PDF' },
    { id: 'both', icon: <Package size={12} />, label: 'Both' },
  ];

  if (markets.length === 0) return null;

  const runExport = async () => {
    // Final validation gate
    if (!validation.canExport) return;

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
        { visualization, showKPI, showSummary, pageTheme, palette: themeConfig.palette, gradient: themeConfig.rlsirGradient, fontHeading: themeConfig.fontHeading, fontBody: themeConfig.fontBody },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(`${msg}. ${DEVELOPER_CONTACT.action}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const marketsWithErrors = validation.markets.filter(m => m.hasErrors);
  const marketsWithWarnings = validation.markets.filter(m => m.hasWarnings && !m.hasErrors);

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

      {/* Validation status badge */}
      {selectedIds.size > 0 && (
        <div className="space-y-2">
          {validation.canExport && validation.warningCount === 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <ShieldCheck size={13} className="text-success shrink-0" />
              <span className="text-[10px] text-success font-medium">All checks passed</span>
            </div>
          )}

          {validation.canExport && validation.warningCount > 0 && (
            <div className="rounded-lg bg-warning/10 border border-warning/20">
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-warning shrink-0" />
                  <span className="text-[10px] text-warning font-medium">
                    {validation.warningCount} warning{validation.warningCount !== 1 ? 's' : ''} — export allowed
                  </span>
                </div>
                {detailsOpen ? <ChevronUp size={12} className="text-warning" /> : <ChevronDown size={12} className="text-warning" />}
              </button>
              {detailsOpen && (
                <div className="px-2.5 pb-2 space-y-1.5">
                  {validation.globalIssues.filter(i => i.severity === 'warning').map((issue, idx) => (
                    <p key={`g-${idx}`} className="text-[9px] text-warning/80 pl-5">
                      {issue.field}: {issue.message}
                    </p>
                  ))}
                  {marketsWithWarnings.map(mr => (
                    <div key={mr.marketId}>
                      <p className="text-[9px] text-warning/90 font-medium pl-5">{mr.marketName}:</p>
                      {mr.issues.filter(i => i.severity === 'warning').map((issue, idx) => (
                        <p key={idx} className="text-[9px] text-warning/70 pl-7">
                          {issue.field}: {issue.message}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!validation.canExport && (
            <div className="rounded-lg bg-error/10 border border-error/20">
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full flex items-center justify-between px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <ShieldX size={13} className="text-error shrink-0" />
                  <span className="text-[10px] text-error font-medium">
                    {validation.errorCount} issue{validation.errorCount !== 1 ? 's' : ''} blocking export
                  </span>
                </div>
                {detailsOpen ? <ChevronUp size={12} className="text-error" /> : <ChevronDown size={12} className="text-error" />}
              </button>
              {detailsOpen && (
                <div className="px-2.5 pb-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {validation.globalIssues.filter(i => i.severity === 'error').map((issue, idx) => (
                    <p key={`g-${idx}`} className="text-[9px] text-error/90 pl-5">
                      {issue.field}: {issue.message}
                    </p>
                  ))}
                  {marketsWithErrors.map(mr => (
                    <div key={mr.marketId}>
                      <p className="text-[9px] text-error/90 font-medium pl-5">{mr.marketName}:</p>
                      {mr.issues.filter(i => i.severity === 'error').map((issue, idx) => (
                        <p key={idx} className="text-[9px] text-error/80 pl-7">
                          {issue.field}: {issue.message}
                        </p>
                      ))}
                    </div>
                  ))}
                  {/* Also show warnings in error panel for completeness */}
                  {validation.warningCount > 0 && (
                    <>
                      <div className="border-t border-warning/10 my-1" />
                      {validation.globalIssues.filter(i => i.severity === 'warning').map((issue, idx) => (
                        <p key={`gw-${idx}`} className="text-[9px] text-warning/70 pl-5">
                          {issue.field}: {issue.message}
                        </p>
                      ))}
                      {marketsWithWarnings.map(mr => (
                        <div key={mr.marketId}>
                          <p className="text-[9px] text-warning/80 font-medium pl-5">{mr.marketName}:</p>
                          {mr.issues.filter(i => i.severity === 'warning').map((issue, idx) => (
                            <p key={idx} className="text-[9px] text-warning/60 pl-7">
                              {issue.field}: {issue.message}
                            </p>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export button */}
      <button
        onClick={runExport}
        disabled={selectedIds.size === 0 || isExporting || !validation.canExport}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
          ${!validation.canExport
            ? 'bg-error/10 text-error/50 border border-error/20 cursor-not-allowed'
            : 'bg-gold/15 text-gold hover:bg-gold/25 border border-gold/20 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
      >
        {isExporting ? (
          <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        ) : !validation.canExport ? (
          <ShieldX size={16} />
        ) : (
          <Download size={16} />
        )}
        {isExporting
          ? 'Exporting...'
          : !validation.canExport
            ? 'Fix Issues to Export'
            : `Export ${selectedIds.size} Report${selectedIds.size !== 1 ? 's' : ''} (ZIP)`
        }
      </button>

      {/* Runtime export error */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-3">
          <p className="text-xs text-error">{error}</p>
        </div>
      )}
    </div>
  );
}
