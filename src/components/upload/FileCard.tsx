import { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X, Eye } from 'lucide-react';
import type { MarketData } from '@/types';
import { useMarketStore } from '@/store/marketStore';

interface FileCardProps {
  market: MarketData;
  index: number;
}

export function FileCard({ market, index }: FileCardProps) {
  const { selectedIds, toggleSelected, setSelectedMarket, selectedMarketId, removeMarket, openPreview, updateMarketTitle } = useMarketStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditValue(market.chartTitle ?? market.marketName);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    updateMarketTitle(market.id, trimmed === market.marketName ? '' : trimmed);
    setIsEditing(false);
  };

  const cancelEdit = () => setIsEditing(false);
  const isSelected = selectedIds.has(market.id);
  const isActive = selectedMarketId === market.id;
  const isUsable = market.status !== 'error' && market.availableViews.length > 0;

  const statusIcon = {
    ready: <CheckCircle size={14} className="text-success" />,
    warning: <AlertTriangle size={14} className="text-warning" />,
    error: <XCircle size={14} className="text-error" />,
    parsing: <div className="w-3.5 h-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />,
    validating: <div className="w-3.5 h-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />,
  };

  const viewBadges = [];
  if (market.isRlsirFirstByDollar) viewBadges.push('$');
  if (market.isRlsirFirstByUnits) viewBadges.push('#');

  return (
    <div
      onClick={() => isUsable && setSelectedMarket(market.id)}
      className={`
        group relative rounded-lg border p-3 cursor-pointer transition-all duration-200
        ${isActive
          ? 'border-gold/40 bg-gold/5 shadow-[0_0_15px_rgba(191,166,122,0.1)]'
          : isUsable
            ? 'border-navy-medium hover:border-gold/20 bg-navy-light/40 hover:bg-navy-light/60'
            : 'border-navy-medium/50 bg-navy-light/20 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Top row: checkbox + status + remove */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isUsable && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleSelected(market.id); }}
              className={`
                w-4 h-4 rounded border flex items-center justify-center text-xs transition-all
                ${isSelected
                  ? 'bg-gold border-gold text-navy-deep'
                  : 'border-gray-muted/40 hover:border-gold/60'
                }
              `}
            >
              {isSelected && '✓'}
            </button>
          )}
          {statusIcon[market.status]}
        </div>

        <div className="flex items-center gap-1">
          {isUsable && (
            <button
              onClick={(e) => { e.stopPropagation(); openPreview(index); }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center
                text-gray-muted hover:text-gold hover:bg-gold/10 transition-all"
              title="Preview"
            >
              <Eye size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeMarket(market.id); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center
              text-gray-muted hover:text-error hover:bg-error/10 transition-all"
            title="Remove"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Market name — double-click to edit */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full font-serif text-sm text-cream font-medium leading-tight mb-1 bg-navy-medium/60 border border-gold/30 rounded px-1.5 py-0.5 outline-none focus:border-gold/60"
        />
      ) : (
        <h3
          onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
          className="font-serif text-sm text-cream font-medium leading-tight mb-1 truncate cursor-text"
          title="Double-click to rename"
        >
          {market.chartTitle ?? market.marketName}
        </h3>
      )}

      {/* Sotheby's share */}
      {market.sothebysData && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gold font-semibold">
            {market.sothebysData.marketShareDollar.toFixed(1)}%
          </span>
          <span className="text-gray-muted">by $</span>
          {market.isRlsirFirstByUnits && (
            <>
              <span className="text-gold/70 font-semibold">
                {market.sothebysData.marketShareUnits.toFixed(1)}%
              </span>
              <span className="text-gray-muted">by #</span>
            </>
          )}
        </div>
      )}

      {/* View badges */}
      {viewBadges.length > 0 && (
        <div className="flex gap-1 mt-2">
          {viewBadges.map(badge => (
            <span key={badge} className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              #{badge === '$' ? '1 by $' : '1 by #'}
            </span>
          ))}
        </div>
      )}

      {/* Warnings/errors */}
      {market.errors.length > 0 && (
        <p className="text-[10px] text-error mt-1 truncate">{market.errors[0]}</p>
      )}
      {market.warnings.length > 0 && market.errors.length === 0 && (
        <p className="text-[10px] text-warning mt-1 truncate">{market.warnings[0]}</p>
      )}
    </div>
  );
}
