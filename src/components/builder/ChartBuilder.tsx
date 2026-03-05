import { useBuilderStore } from '@/store/builderStore';
import { FileDropZone } from './FileDropZone';
import { ColumnPicker } from './ColumnPicker';
import { ChartTypePicker } from './ChartTypePicker';
import { LiveChart } from './LiveChart';
import { StyleControls } from './StyleControls';
import { ExportButton } from './ExportButton';
import { X } from 'lucide-react';

export function ChartBuilder() {
  const workbook = useBuilderStore(s => s.workbook);
  const isLoading = useBuilderStore(s => s.isLoading);
  const error = useBuilderStore(s => s.error);
  const activeSheetIndex = useBuilderStore(s => s.activeSheetIndex);
  const chartTitle = useBuilderStore(s => s.chartTitle);
  const clearWorkbook = useBuilderStore(s => s.clearWorkbook);
  const setActiveSheet = useBuilderStore(s => s.setActiveSheet);
  const setChartTitle = useBuilderStore(s => s.setChartTitle);

  // No file — show centered drop zone
  if (!workbook && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl text-cream/60 mb-2">Custom Chart</h2>
            <p className="text-sm text-gray-muted">Drop any Excel or CSV file to get started</p>
          </div>
          <FileDropZone />
          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Has file — sidebar + chart layout
  return (
    <div className="flex-1 flex min-h-0">
      {/* Left sidebar */}
      <div className="w-[280px] shrink-0 border-r border-navy-medium bg-navy-deep/50 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* File header */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream truncate flex-1" title={workbook?.fileName}>
              {workbook?.fileName}
            </span>
            <button
              onClick={clearWorkbook}
              className="text-gray-muted hover:text-cream transition-colors shrink-0"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>

          {/* Sheet tabs */}
          {workbook && workbook.sheets.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {workbook.sheets.map((sheet, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSheet(i)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                    ${i === activeSheetIndex
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'text-gray-muted hover:text-cream bg-navy-light/30 border border-transparent'
                    }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
          )}

          {/* Column picker */}
          <ColumnPicker />

          {/* Divider */}
          <div className="h-px bg-navy-medium" />

          {/* Chart type */}
          <ChartTypePicker />

          {/* Divider */}
          <div className="h-px bg-navy-medium" />

          {/* Style controls */}
          <StyleControls />
        </div>
      </div>

      {/* Right — chart + bottom bar */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chart preview */}
        <div className="flex-1 min-h-0 p-6">
          <div className="w-full h-full rounded-xl bg-navy-deep border border-navy-medium p-4">
            <LiveChart />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-navy-medium px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-widest text-gray-muted mb-1 block">Title</label>
            <input
              type="text"
              value={chartTitle}
              onChange={e => setChartTitle(e.target.value)}
              placeholder="Chart title..."
              className="w-full max-w-sm bg-navy-light/30 border border-navy-medium rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-gray-muted/40 focus:outline-none focus:border-gold/40"
            />
          </div>
          <ExportButton />
        </div>
      </div>
    </div>
  );
}
