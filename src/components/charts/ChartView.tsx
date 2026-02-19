import { useState, useMemo } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { MarketShareBar } from './MarketShareBar';
import { MarketShareTreemap } from './MarketShareTreemap';
import { MarketShareSankey } from './MarketShareSankey';
import { KPICards, KPICardsSkeleton } from '@/components/metrics/KPICards';
import { ExecutiveSummary, ExecutiveSummarySkeleton } from '@/components/metrics/ExecutiveSummary';
import { BarChart3, Grid3x3, GitBranch, Eye, EyeOff, LayoutDashboard, FileText, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { COLORS } from '@/lib/constants';
import { generateExecutiveSummary } from '@/lib/summaryGenerator';
import type { VisualizationType, ShareType, PageTheme } from '@/types';

// Monthly hero images — luxury interiors/exteriors
export const HERO_IMAGES: readonly string[] = [
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

export function ChartView() {
  const { getCurrentMarket, shareType, setShareType, visualization, setVisualization, isProcessing, markets, showKPI, setShowKPI, showSummary, setShowSummary, pageTheme, setPageTheme } = useMarketStore();
  const market = getCurrentMarket();
  const [previewMode, setPreviewMode] = useState(false);

  // Empty state
  if (!isProcessing && markets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-navy-light/50 border border-navy-medium flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={32} className="text-gray-muted" />
          </div>
          <h3 className="font-serif text-xl text-cream/60 mb-2">No Market Data</h3>
          <p className="text-sm text-gray-muted">Upload CSV or Excel files to begin analysis</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isProcessing && !market) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <div className="skeleton w-full rounded-xl" style={{ height: 400 }} />
        <KPICardsSkeleton />
        <ExecutiveSummarySkeleton />
      </div>
    );
  }

  if (!market || market.availableViews.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-warning text-2xl">!</span>
          </div>
          <h3 className="font-serif text-lg text-cream mb-2">Chart Not Available</h3>
          <p className="text-sm text-gray-muted">
            {market
              ? "RLSIR is not ranked #1 in any view for this market. Select a different file."
              : "Select a file from the queue to view its chart."
            }
          </p>
        </div>
      </div>
    );
  }

  const vizTabs: { id: VisualizationType; icon: React.ReactNode; label: string }[] = [
    { id: 'bar', icon: <BarChart3 size={14} />, label: 'Bar Chart' },
    { id: 'treemap', icon: <Grid3x3 size={14} />, label: 'Treemap' },
    { id: 'sankey', icon: <GitBranch size={14} />, label: 'Sankey' },
  ];

  const heroUrl = HERO_IMAGES[new Date().getMonth()];

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Visualization tabs */}
          <div className="flex items-center gap-1">
            {vizTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setVisualization(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${visualization === tab.id
                    ? 'bg-gold/15 text-gold border border-gold/20'
                    : 'text-gray-muted hover:text-cream hover:bg-navy-light border border-transparent'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${previewMode
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-gray-muted hover:text-cream hover:bg-navy-light border border-transparent'
              }`}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewMode ? 'Editor View' : 'Preview'}
          </button>
        </div>

        {/* Share type toggle */}
        <div className="flex items-center gap-1 bg-navy-light/50 rounded-lg p-0.5">
          {market.availableViews.map(view => (
            <button
              key={view}
              onClick={() => setShareType(view)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${shareType === view
                  ? 'bg-gold/15 text-gold shadow-sm'
                  : 'text-gray-muted hover:text-cream'
                }`}
            >
              {view === 'dollar' ? 'By Dollar ($)' : 'By Units (#)'}
            </button>
          ))}
        </div>
      </div>

      {previewMode ? (
        /* ── Branded template preview with config sidebar ── */
        <div className="flex gap-4">

          {/* Left config sidebar */}
          <div className="w-52 shrink-0 space-y-4">

            {/* Chart Type */}
            <div className="glass rounded-lg p-3">
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2.5 block">
                Chart Type
              </span>
              <div className="space-y-1">
                {vizTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setVisualization(tab.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                      ${visualization === tab.id
                        ? 'bg-gold/15 text-gold border border-gold/20'
                        : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Sections */}
            <div className="glass rounded-lg p-3">
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2.5 block">
                Page Sections
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => setShowKPI(!showKPI)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                    ${showKPI
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard size={14} />
                    KPI Banner
                  </span>
                  {showKPI ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                    ${showSummary
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <FileText size={14} />
                    Exec Summary
                  </span>
                  {showSummary ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="glass rounded-lg p-3">
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2.5 block">
                Theme
              </span>
              <div className="space-y-1">
                {([
                  { id: 'light' as PageTheme, icon: <Sun size={14} />, label: 'Light' },
                  { id: 'dark' as PageTheme, icon: <Moon size={14} />, label: 'Dark' },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPageTheme(t.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                      ${pageTheme === t.id
                        ? 'bg-gold/15 text-gold border border-gold/20'
                        : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                      }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Share type */}
            <div className="glass rounded-lg p-3">
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2.5 block">
                Data View
              </span>
              <div className="space-y-1">
                {market.availableViews.map(view => (
                  <button
                    key={view}
                    onClick={() => setShareType(view)}
                    className={`w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                      ${shareType === view
                        ? 'bg-gold/15 text-gold border border-gold/20'
                        : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
                      }`}
                  >
                    {view === 'dollar' ? 'By Dollar ($)' : 'By Units (#)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Branded page */}
          <div className="flex-1 flex justify-center">
            <BrandedPage
              market={market}
              shareType={shareType}
              visualization={visualization}
              heroUrl={heroUrl}
              showKPI={showKPI}
              showSummary={showSummary}
              pageTheme={pageTheme}
            />
          </div>
        </div>
      ) : (
        /* ── Standard editor view ── */
        <>
          {/* Chart */}
          <div className="rounded-xl p-4 shadow-lg bg-navy-deep border border-navy-medium" style={{ height: 460 }}>
            {visualization === 'bar' && <MarketShareBar key={`bar-${market.id}-${shareType}`} market={market} shareType={shareType} />}
            {visualization === 'treemap' && <MarketShareTreemap key={`treemap-${market.id}-${shareType}`} market={market} shareType={shareType} mode="preview" />}
            {visualization === 'sankey' && <MarketShareSankey key={`sankey-${market.id}-${shareType}`} market={market} shareType={shareType} mode="preview" />}
          </div>

          {/* KPI Cards */}
          <KPICards market={market} />

          {/* Executive Summary */}
          <ExecutiveSummary market={market} shareType={shareType} />
        </>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────
   Branded Page — the 8.5×11 template preview
   ──────────────────────────────────────────────── */

export interface BrandedPageProps {
  market: import('@/types').MarketData;
  shareType: ShareType;
  visualization: VisualizationType;
  heroUrl: string;
  showKPI: boolean;
  showSummary: boolean;
  pageTheme?: PageTheme;
}

function formatDollar(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function BrandedPage({ market, shareType, visualization, heroUrl, showKPI, showSummary, pageTheme = 'light' }: BrandedPageProps) {
  const summary = useMemo(
    () => showSummary ? generateExecutiveSummary(market, shareType) : '',
    [market, shareType, showSummary]
  );

  const sothebys = market.sothebysData;
  const isDark = pageTheme === 'dark';

  // Count active content blocks to scale fonts proportionally
  const extraSections = (showKPI ? 1 : 0) + (showSummary ? 1 : 0);

  // Theme colors
  const pageBg = isDark ? COLORS.navy : '#ffffff';
  const contrastBg = isDark ? '#ffffff' : COLORS.navy; // opposite of page bg for standout sections
  const footerText = isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af';
  const footerBorder = COLORS.gold;

  const kpiItems = sothebys ? [
    { label: 'Volume', value: formatDollar(sothebys.dollarVolume), accent: true },
    { label: 'Sales', value: Math.round(sothebys.totalSales).toLocaleString(), accent: false },
    { label: 'Avg Price', value: formatDollar(sothebys.avgPrice), accent: true },
    { label: 'DOM', value: sothebys.daysOnMarket > 0 ? `${Math.round(sothebys.daysOnMarket)}` : '—', accent: false },
    { label: '$/SqFt', value: sothebys.pricePerSqFt > 0 ? `$${Math.round(sothebys.pricePerSqFt)}` : '—', accent: false },
    { label: 'SP/LP', value: sothebys.saleToListRatio > 0 ? `${(sothebys.saleToListRatio * 100).toFixed(1)}%` : '—', accent: false },
  ] : [];

  return (
    <div
      className="w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden"
      style={{ aspectRatio: '8.5 / 11', backgroundColor: pageBg }}
    >

      {/* ── Hero band — fixed proportion ── */}
      <div className="relative overflow-hidden shrink-0" style={{ flex: '0 0 28%' }}>
        <img
          src={heroUrl}
          alt={market.marketName}
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 p-6 z-10">
          <h1 className="text-white font-bold uppercase leading-[0.95]" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
            {market.marketName.split(' ').map((word, i) => (
              <span key={i}>{word}<br /></span>
            ))}
          </h1>
        </div>

        <img
          src="/images/logos/sothebys-branding.png"
          alt="Russ Lyon Sotheby's International Realty"
          className="absolute top-0 right-0 z-10"
          style={{ height: '100%', width: 'auto' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ── Bento content area — fills remaining space ── */}
      <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: pageBg }}>

        {/* KPI Strip — premium horizontal metrics row */}
        {showKPI && sothebys && (
          <div className="shrink-0">
            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: COLORS.navy,
                borderTop: `2px solid ${COLORS.gold}`,
                padding: extraSections > 1 ? '7px 16px' : '9px 20px',
              }}
            >
              {kpiItems.map((kpi, idx) => (
                <div key={kpi.label} className="flex items-center">
                  <div className="text-center" style={{ minWidth: 56 }}>
                    <div
                      className="font-bold leading-none"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: extraSections > 1 ? 12 : 14,
                        color: kpi.accent ? COLORS.gold : COLORS.cream,
                      }}
                    >
                      {kpi.value}
                    </div>
                    <div
                      className="uppercase font-medium"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 5,
                        letterSpacing: '0.15em',
                        color: 'rgba(255,255,255,0.3)',
                        marginTop: 3,
                      }}
                    >
                      {kpi.label}
                    </div>
                  </div>
                  {idx < kpiItems.length - 1 && (
                    <div style={{ width: 1, height: 22, backgroundColor: 'rgba(191,166,122,0.2)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Overview — contrasting background bar */}
        {showSummary && (
          <div
            className="shrink-0 px-6 py-3 flex items-start gap-3"
            style={{ backgroundColor: contrastBg }}
          >
            <div
              className="shrink-0 self-stretch rounded-full"
              style={{ width: 3, backgroundColor: COLORS.gold }}
            />
            <div className="min-w-0">
              <p
                className="font-semibold uppercase mb-0.5"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: extraSections > 1 ? 7 : 8,
                  letterSpacing: '0.2em',
                  color: isDark ? COLORS.navy : COLORS.gold,
                }}
              >
                Market Overview
              </p>
              <p
                className="italic leading-relaxed"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: extraSections > 1 ? 7.5 : 8.5,
                  lineHeight: 1.55,
                  color: isDark ? '#374151' : 'rgba(255,255,255,0.85)',
                }}
              >
                {summary}
              </p>
            </div>
          </div>
        )}

        {/* Chart — takes all remaining vertical space */}
        <div className="flex-1 min-h-0 px-4 py-1">
          <div className="h-full w-full">
            {visualization === 'bar' && <MarketShareBar key={`branded-${market.id}-${shareType}-${extraSections}-${pageTheme}`} market={market} shareType={shareType} mode="branded" darkBg={isDark} />}
            {visualization === 'treemap' && <MarketShareTreemap key={`treemap-${market.id}-${shareType}-${extraSections}-${pageTheme}`} market={market} shareType={shareType} mode="branded" darkBg={isDark} />}
            {visualization === 'sankey' && <MarketShareSankey key={`sankey-${market.id}-${shareType}-${extraSections}-${pageTheme}`} market={market} shareType={shareType} mode="branded" darkBg={isDark} />}
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ borderTop: `2px solid ${footerBorder}`, backgroundColor: pageBg }}
      >
        {/* Bottom-left: Equal Housing + Realtor logos */}
        <div className="flex items-center gap-2">
          <img
            src="/images/logos/equal-housing.svg"
            alt="Equal Housing Opportunity"
            style={{ height: 18, opacity: isDark ? 0.5 : 0.7 }}
            className={isDark ? 'invert' : ''}
            crossOrigin="anonymous"
          />
          <img
            src="/images/logos/realtor.svg"
            alt="Realtor"
            style={{ height: 16, opacity: isDark ? 0.5 : 0.7 }}
            className={isDark ? 'invert' : ''}
            crossOrigin="anonymous"
          />
        </div>

        {/* Bottom-right: ARMLS disclaimer */}
        <p
          className="text-right leading-tight"
          style={{ fontSize: 5, color: footerText, maxWidth: '65%' }}
        >
          ARMLS data compiled through BrokerMetrics® — Total $ Volume by Broker ($1M and up) — Metro Phoenix — 03/01/2024 - 04/02/2025
        </p>
      </div>

    </div>
  );
}
