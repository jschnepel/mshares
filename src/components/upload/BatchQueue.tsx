import { useMarketStore } from '@/store/marketStore';
import { FileCard } from './FileCard';
import { CheckSquare, Square, Trash2 } from 'lucide-react';

export function BatchQueue() {
  const { markets, selectedIds, selectAll, deselectAll, clearAll } = useMarketStore();

  if (markets.length === 0) return null;

  const readyCount = markets.filter(m => m.status !== 'error' && m.availableViews.length > 0).length;
  const allSelected = readyCount > 0 && selectedIds.size >= readyCount;

  return (
    <div className="mt-4">
      {/* Batch controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-muted">
            {markets.length} file{markets.length !== 1 ? 's' : ''} &middot; {selectedIds.size} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="flex items-center gap-1 text-xs text-gray-muted hover:text-cream transition-colors"
          >
            {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-muted hover:text-error transition-colors"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* File cards grid */}
      <div className="grid grid-cols-1 gap-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
        {markets.map((market, index) => (
          <FileCard key={market.id} market={market} index={index} />
        ))}
      </div>
    </div>
  );
}
