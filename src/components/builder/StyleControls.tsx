import { useBuilderStore } from '@/store/builderStore';

const DEFAULT_SERIES_COLORS = ['#002349', '#BFA67A', '#6b7f94', '#9ca3af', '#e5a855', '#7c9eb8'];

export function StyleControls() {
  const valueColumns = useBuilderStore(s => s.valueColumns);
  const seriesColors = useBuilderStore(s => s.seriesColors);
  const showDataLabels = useBuilderStore(s => s.showDataLabels);
  const showLegend = useBuilderStore(s => s.showLegend);
  const bgColor = useBuilderStore(s => s.bgColor);
  const setSeriesColor = useBuilderStore(s => s.setSeriesColor);
  const setShowDataLabels = useBuilderStore(s => s.setShowDataLabels);
  const setShowLegend = useBuilderStore(s => s.setShowLegend);
  const setBgColor = useBuilderStore(s => s.setBgColor);

  const sheet = useBuilderStore(s => s.getActiveSheet());

  return (
    <div className="space-y-4">
      <label className="text-[10px] uppercase tracking-widest text-gold font-semibold block">
        Style
      </label>

      {/* Series Colors */}
      {valueColumns.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-muted block">Series Colors</span>
          {valueColumns.map((colIdx, i) => {
            const col = sheet?.columns[colIdx];
            const color = seriesColors[colIdx] ?? DEFAULT_SERIES_COLORS[i % DEFAULT_SERIES_COLORS.length];
            return (
              <div key={colIdx} className="flex items-center gap-2">
                <label className="relative w-7 h-7 rounded-lg border border-navy-medium overflow-hidden cursor-pointer shrink-0">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setSeriesColor(colIdx, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full rounded-lg" style={{ backgroundColor: color }} />
                </label>
                <span className="text-xs text-gray-muted truncate">{col?.displayName ?? `Col ${colIdx}`}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Background */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-muted block">Background</span>
        <div className="flex items-center gap-2">
          <label className="relative w-7 h-7 rounded-lg border border-navy-medium overflow-hidden cursor-pointer shrink-0">
            <input
              type="color"
              value={bgColor === 'transparent' ? '#0a1628' : bgColor}
              onChange={e => setBgColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full rounded-lg" style={{ backgroundColor: bgColor === 'transparent' ? '#0a1628' : bgColor }} />
          </label>
          <button
            onClick={() => setBgColor(bgColor === 'transparent' ? '#0a1628' : 'transparent')}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all
              ${bgColor === 'transparent'
                ? 'bg-gold/15 text-gold border border-gold/20'
                : 'text-gray-muted hover:text-cream border border-navy-medium'
              }`}
          >
            Transparent
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <button
          onClick={() => setShowDataLabels(!showDataLabels)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs"
        >
          <span className="text-gray-muted">Data Labels</span>
          <div className={`w-8 h-4.5 rounded-full transition-colors ${showDataLabels ? 'bg-gold' : 'bg-navy-medium'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5
              ${showDataLabels ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
        </button>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs"
        >
          <span className="text-gray-muted">Legend</span>
          <div className={`w-8 h-4.5 rounded-full transition-colors ${showLegend ? 'bg-gold' : 'bg-navy-medium'}`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5
              ${showLegend ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
