import { useBuilderStore } from '@/store/builderStore';
import type { ColumnDataType } from '@/types';

const TYPE_BADGE: Record<ColumnDataType, { label: string; cls: string }> = {
  string:     { label: 'ABC', cls: 'bg-blue-500/15 text-blue-400' },
  date:       { label: 'DATE', cls: 'bg-purple-500/15 text-purple-400' },
  integer:    { label: 'INT', cls: 'bg-emerald-500/15 text-emerald-400' },
  float:      { label: 'DEC', cls: 'bg-teal-500/15 text-teal-400' },
  percentage: { label: '%', cls: 'bg-amber-500/15 text-amber-400' },
  currency:   { label: '$', cls: 'bg-yellow-500/15 text-yellow-400' },
};

function Badge({ type }: { type: ColumnDataType }) {
  const b = TYPE_BADGE[type];
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${b.cls}`}>
      {b.label}
    </span>
  );
}

export function ColumnPicker() {
  const sheet = useBuilderStore(s => s.getActiveSheet());
  const labelColumn = useBuilderStore(s => s.labelColumn);
  const valueColumns = useBuilderStore(s => s.valueColumns);
  const chartType = useBuilderStore(s => s.chartType);
  const setLabelColumn = useBuilderStore(s => s.setLabelColumn);
  const toggleValueColumn = useBuilderStore(s => s.toggleValueColumn);

  if (!sheet) return null;

  const maxVals = chartType === 'pie' || chartType === 'donut' ? 1 : chartType === 'scatter' ? 2 : 6;
  const numericTypes: ColumnDataType[] = ['integer', 'float', 'percentage', 'currency'];
  const numericCols = sheet.columns.filter(c => numericTypes.includes(c.dataType) && c.index !== labelColumn);

  // Sort columns: string/date first, then numeric
  const allCols = [...sheet.columns].sort((a, b) => {
    const aIsLabel = a.dataType === 'string' || a.dataType === 'date';
    const bIsLabel = b.dataType === 'string' || b.dataType === 'date';
    if (aIsLabel && !bIsLabel) return -1;
    if (!aIsLabel && bIsLabel) return 1;
    return a.index - b.index;
  });

  return (
    <div className="space-y-4">
      {/* Label Column */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2 block">
          Label Column
        </label>
        <select
          value={labelColumn ?? ''}
          onChange={e => setLabelColumn(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full bg-navy-light/40 border border-navy-medium rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-gold/50"
        >
          <option value="">Select column...</option>
          {allCols.map(col => (
            <option key={col.index} value={col.index}>
              {col.displayName} ({col.dataType})
            </option>
          ))}
        </select>
      </div>

      {/* Value Columns */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2 block">
          Value Columns {valueColumns.length > 0 && `(${valueColumns.length}/${maxVals})`}
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {numericCols.map(col => {
            const isSelected = valueColumns.includes(col.index);
            const isDisabled = !isSelected && valueColumns.length >= maxVals;
            return (
              <button
                key={col.index}
                onClick={() => toggleValueColumn(col.index)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left
                  ${isSelected
                    ? 'bg-gold/15 text-cream border border-gold/20'
                    : isDisabled
                      ? 'text-gray-muted/40 border border-transparent cursor-not-allowed'
                      : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                  }
                `}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-gold border-gold' : 'border-navy-medium'}`}
                >
                  {isSelected && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-navy-deep">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="flex-1 truncate">{col.displayName}</span>
                <Badge type={col.dataType} />
              </button>
            );
          })}
          {numericCols.length === 0 && (
            <p className="text-xs text-gray-muted/60 py-2 text-center">No numeric columns found</p>
          )}
        </div>
      </div>
    </div>
  );
}
