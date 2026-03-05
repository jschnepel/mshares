import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, BarChart3, Grid3x3, GitBranch, Circle, Minus } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import { BrandedPage } from '@/components/charts/ChartView';
import type { VisualizationType, ShareType } from '@/types';

export function PreviewModal() {
  const {
    previewOpen, closePreview, navigatePreview, getPreviewMarket, getReadyMarkets, previewIndex, heroImages,
    showKPI, showSummary, pageTheme, themeConfig, visualization,
  } = useMarketStore();

  const [viz, setViz] = useState<VisualizationType>('bar');
  const [shareType, setShareType] = useState<ShareType>('dollar');

  const market = getPreviewMarket();
  const readyMarkets = getReadyMarkets();
  const total = readyMarkets.length;

  // Sync viz with the main workspace visualization when modal opens
  useEffect(() => {
    if (previewOpen) setViz(visualization);
  }, [previewOpen, visualization]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!previewOpen) return;
    if (e.key === 'Escape') closePreview();
    if (e.key === 'ArrowLeft') navigatePreview('prev');
    if (e.key === 'ArrowRight') navigatePreview('next');
  }, [previewOpen, closePreview, navigatePreview]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Adjust share type when market changes
  useEffect(() => {
    if (market) {
      if (!market.availableViews.includes(shareType)) {
        setShareType(market.availableViews[0] ?? 'dollar');
      }
    }
  }, [market, shareType]);

  if (!previewOpen || !market) return null;

  const heroState = heroImages.get(market.id) ?? { url: '', crop: { x: 50, y: 50 } };

  const vizTabs: { id: VisualizationType; icon: React.ReactNode; label: string }[] = [
    { id: 'bar', icon: <BarChart3 size={14} />, label: 'Bar Chart' },
    { id: 'treemap', icon: <Grid3x3 size={14} />, label: 'Treemap' },
    { id: 'sankey', icon: <GitBranch size={14} />, label: 'Sankey' },
    { id: 'donut', icon: <Circle size={14} />, label: 'Donut' },
    { id: 'lollipop', icon: <Minus size={14} />, label: 'Lollipop' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={closePreview}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[90vw] max-w-[1200px] h-[90vh] bg-navy-deep border border-navy-medium rounded-xl
          shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Controls bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-navy-medium/50 bg-navy-light/30">
          <div className="flex items-center gap-4">
            {/* Viz tabs */}
            <div className="flex items-center gap-1">
              {vizTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViz(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${viz === tab.id
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'text-gray-muted hover:text-cream hover:bg-navy-medium/50 border border-transparent'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Share type toggle */}
            <div className="flex items-center gap-1">
              {market.availableViews.map(view => (
                <button
                  key={view}
                  onClick={() => setShareType(view)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${shareType === view
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'text-gray-muted hover:text-cream hover:bg-navy-medium/50 border border-transparent'
                    }`}
                >
                  {view === 'dollar' ? 'By Dollar ($)' : 'By Units (#)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-muted">
              {previewIndex + 1} / {total}
            </span>
            <button
              onClick={closePreview}
              className="w-8 h-8 rounded-lg bg-navy-light hover:bg-navy-medium flex items-center justify-center
                text-gray-muted hover:text-cream transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Branded page preview — uses the same BrandedPage as the editor */}
        <div className="flex-1 overflow-y-auto flex justify-center p-6 bg-[#1a1a2e]">
          <BrandedPage
            market={market}
            shareType={shareType}
            visualization={viz}
            heroUrl={heroState.url}
            heroCrop={heroState.crop}
            showKPI={showKPI}
            showSummary={showSummary}
            pageTheme={pageTheme}
            palette={themeConfig.palette}
            gradient={themeConfig.rlsirGradient}
            fontHeading={themeConfig.fontHeading}
            fontBody={themeConfig.fontBody}
          />
        </div>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => navigatePreview('prev')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                bg-navy-light/80 hover:bg-navy-medium border border-navy-medium
                flex items-center justify-center text-gray-muted hover:text-cream transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigatePreview('next')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                bg-navy-light/80 hover:bg-navy-medium border border-navy-medium
                flex items-center justify-center text-gray-muted hover:text-cream transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Bottom bar: dots + export */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-navy-medium bg-navy-light/30">
          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {readyMarkets.map((m, i) => (
              <button
                key={m.id}
                onClick={() => {
                  const store = useMarketStore.getState();
                  store.openPreview(i);
                }}
                className={`w-2 h-2 rounded-full transition-all
                  ${i === previewIndex ? 'bg-gold w-4' : 'bg-navy-medium hover:bg-gray-muted'}`}
                title={m.chartTitle ?? m.marketName}
              />
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/15 text-gold
            hover:bg-gold/25 border border-gold/20 text-xs font-medium transition-all">
            <Download size={14} />
            Export This Report
          </button>
        </div>
      </div>
    </div>
  );
}
