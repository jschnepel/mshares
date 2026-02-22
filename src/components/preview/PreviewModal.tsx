import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, BarChart3, Grid3x3, GitBranch } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import { MarketShareBar } from '@/components/charts/MarketShareBar';
import { MarketShareTreemap } from '@/components/charts/MarketShareTreemap';
import { MarketShareSankey } from '@/components/charts/MarketShareSankey';
import { COLORS } from '@/lib/constants';
import type { VisualizationType, ShareType } from '@/types';

// Monthly hero images — luxury interiors/exteriors (Unsplash, 1600w)
const HERO_IMAGES: readonly string[] = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1600',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1600',
];

function getHeroImage() {
  return HERO_IMAGES[new Date().getMonth()];
}

export function PreviewModal() {
  const {
    previewOpen, closePreview, navigatePreview, getPreviewMarket, getReadyMarkets, previewIndex,
  } = useMarketStore();

  const [viz, setViz] = useState<VisualizationType>('bar');
  const [shareType, setShareType] = useState<ShareType>('dollar');

  const market = getPreviewMarket();
  const readyMarkets = getReadyMarkets();
  const total = readyMarkets.length;

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

  const vizTabs: { id: VisualizationType; icon: React.ReactNode; label: string }[] = [
    { id: 'bar', icon: <BarChart3 size={14} />, label: 'Bar Chart' },
    { id: 'treemap', icon: <Grid3x3 size={14} />, label: 'Treemap' },
    { id: 'sankey', icon: <GitBranch size={14} />, label: 'Sankey' },
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

        {/* Branded page preview — matches export template */}
        <div className="flex-1 overflow-y-auto flex justify-center p-6 bg-[#1a1a2e]">
          <div className="w-full max-w-[600px] bg-white shadow-2xl" style={{ aspectRatio: '8.5 / 11' }}>

            {/* Hero band */}
            <div className="relative overflow-hidden" style={{ height: '32%' }}>
              <img
                src={getHeroImage()}
                alt={market.chartTitle ?? market.marketName}
                className="absolute inset-0 w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

              {/* Market name */}
              <div className="absolute bottom-0 left-0 p-6 z-10">
                <h1 className="text-white font-bold uppercase leading-[0.95]" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                  {(market.chartTitle ?? market.marketName).split(' ').map((word, i) => (
                    <span key={i}>{word}<br /></span>
                  ))}
                </h1>
              </div>

              {/* Navy branding box (top-right) */}
              <div
                className="absolute top-0 right-0 flex flex-col items-center justify-center px-4 py-3 z-10"
                style={{ backgroundColor: COLORS.navy, minWidth: '140px' }}
              >
                <span className="text-white text-sm font-serif font-bold tracking-wide">Russ Lyon</span>
                <div className="w-10 border-t my-0.5" style={{ borderColor: COLORS.gold }} />
                <span className="text-white/85 text-[8px] font-serif">Sotheby's International Realty</span>
                <span className="text-[7px] font-semibold mt-1.5" style={{ color: COLORS.gold }}>russlyon.com</span>
                <span className="text-white/50 text-[6px]">480.585.7070</span>
              </div>
            </div>

            {/* Tagline bar — reserved blank space */}
            <div className="flex items-center justify-center px-4" style={{ height: '3.5%', backgroundColor: COLORS.navy }}>
              {/* Blank — content added manually by broker */}
            </div>

            {/* Chart area */}
            <div className="bg-white px-4 pt-2" style={{ height: '56%' }}>
              <div className="h-full">
                {viz === 'bar' && <MarketShareBar market={market} shareType={shareType} mode="branded" />}
                {viz === 'treemap' && <MarketShareTreemap market={market} shareType={shareType} />}
                {viz === 'sankey' && <MarketShareSankey market={market} shareType={shareType} />}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4" style={{ height: '4.5%', borderTop: `2px solid ${COLORS.gold}` }}>
              <div className="flex items-center gap-2">
                <span className="text-[6px] text-gray-400">ARMLS data compiled through BrokerMetrics</span>
              </div>
              <span className="text-[6px] text-gray-400">
                Russ Lyon Sotheby's International Realty
              </span>
            </div>

          </div>
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
