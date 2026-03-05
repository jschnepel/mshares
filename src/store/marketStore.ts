import { create } from 'zustand';
import type { MarketData, ShareType, VisualizationType, ExportFormat, PageTheme, ThemeConfig, KPILayout } from '@/types';
import { processFiles } from '@/lib/fileProcessor';
import { getMonthlyHeroImages } from '@/lib/heroImages';
import { defaultThemeConfig } from '@/lib/themeDefaults';

export interface HeroImageState {
  url: string;
  crop: { x: number; y: number };
}

interface MarketStore {
  // Data
  markets: MarketData[];
  selectedMarketId: string | null;
  selectedIds: Set<string>;

  // View state
  shareType: ShareType;
  visualization: VisualizationType;
  isProcessing: boolean;
  previewOpen: boolean;
  previewIndex: number;
  showKPI: boolean;
  showSummary: boolean;
  pageTheme: PageTheme;
  themeConfig: ThemeConfig;
  kpiLayout: KPILayout;

  // Per-market hero images (keyed by market id)
  heroImages: Map<string, HeroImageState>;
  // Tracks which pool index to assign next (for no-repeat distribution)
  _heroPoolIndex: number;

  // Date range (applies to all exports)
  dateStart: string;
  dateEnd: string;

  // Export state
  exportFormat: ExportFormat;
  isExporting: boolean;
  exportProgress: number;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  updateMarketTitle: (id: string, title: string) => void;
  setDateRange: (start: string, end: string) => void;
  removeMarket: (id: string) => void;
  clearAll: () => void;
  setSelectedMarket: (id: string | null) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setShareType: (type: ShareType) => void;
  setVisualization: (type: VisualizationType) => void;
  setShowKPI: (val: boolean) => void;
  setShowSummary: (val: boolean) => void;
  setPageTheme: (theme: PageTheme) => void;
  setThemeConfig: (config: ThemeConfig) => void;
  setKPILayout: (layout: KPILayout) => void;
  openPreview: (index: number) => void;
  closePreview: () => void;
  navigatePreview: (direction: 'prev' | 'next') => void;
  setHeroImage: (marketId: string, url: string) => void;
  setHeroCrop: (marketId: string, crop: { x: number; y: number }) => void;
  getHeroImage: (marketId: string) => HeroImageState;
  setExportFormat: (format: ExportFormat) => void;
  setIsExporting: (val: boolean) => void;
  setExportProgress: (val: number) => void;

  // Computed
  getSelectedMarkets: () => MarketData[];
  getReadyMarkets: () => MarketData[];
  getCurrentMarket: () => MarketData | null;
  getPreviewMarket: () => MarketData | null;
}

const DEFAULT_CROP = { x: 50, y: 50 };

export const useMarketStore = create<MarketStore>((set, get) => ({
  markets: [],
  selectedMarketId: null,
  selectedIds: new Set(),
  shareType: 'dollar',
  visualization: 'bar',
  isProcessing: false,
  previewOpen: false,
  previewIndex: 0,
  showKPI: false,
  showSummary: false,
  pageTheme: 'light' as PageTheme,
  themeConfig: defaultThemeConfig(),
  kpiLayout: 'grid-3col' as KPILayout,
  heroImages: new Map(),
  _heroPoolIndex: 0,
  dateStart: '',
  dateEnd: '',
  exportFormat: 'png',
  isExporting: false,
  exportProgress: 0,

  addFiles: async (files) => {
    set({ isProcessing: true });
    try {
      const results = await processFiles(files);
      set(state => {
        const newMarkets = [...state.markets, ...results];
        const newSelected = new Set(state.selectedIds);
        const newHeroImages = new Map(state.heroImages);
        // Use end date's month if set, otherwise current system month
        let heroMonth: number | undefined;
        if (state.dateEnd) {
          const dm = state.dateEnd.match(/^(\d{2})\//);
          if (dm) heroMonth = parseInt(dm[1], 10) - 1;
        }
        const pool = getMonthlyHeroImages(heroMonth);
        let poolIdx = state._heroPoolIndex;

        results.forEach(m => {
          if (m.status !== 'error' && m.availableViews.length > 0) {
            newSelected.add(m.id);
          }
          // Assign a unique hero image from the monthly pool (round-robin, no repeats until pool exhausted)
          if (pool.length > 0) {
            newHeroImages.set(m.id, { url: pool[poolIdx % pool.length], crop: { ...DEFAULT_CROP } });
            poolIdx++;
          }
        });

        return {
          markets: newMarkets,
          selectedIds: newSelected,
          heroImages: newHeroImages,
          _heroPoolIndex: poolIdx,
          selectedMarketId: state.selectedMarketId ?? results.find(m => m.status !== 'error')?.id ?? null,
        };
      });
    } finally {
      set({ isProcessing: false });
    }
  },

  setDateRange: (start, end) => set(state => {
    // Use the END date's month to pick the hero image folder
    let month: number | undefined;
    if (end) {
      const m = end.match(/^(\d{2})\//);
      if (m) month = parseInt(m[1], 10) - 1; // 0-indexed
    }
    const pool = getMonthlyHeroImages(month);
    if (pool.length === 0) return { dateStart: start, dateEnd: end };

    // Reassign all market hero images from the new month's pool (round-robin)
    const newHeroImages = new Map<string, HeroImageState>();
    let poolIdx = 0;
    for (const market of state.markets) {
      const existing = state.heroImages.get(market.id);
      newHeroImages.set(market.id, {
        url: pool[poolIdx % pool.length],
        crop: existing?.crop ?? { ...DEFAULT_CROP },
      });
      poolIdx++;
    }

    return { dateStart: start, dateEnd: end, heroImages: newHeroImages, _heroPoolIndex: poolIdx };
  }),

  updateMarketTitle: (id, title) => set(state => ({
    markets: state.markets.map(m => m.id === id ? { ...m, chartTitle: title || undefined } : m),
  })),

  removeMarket: (id) => set(state => {
    const newSelected = new Set(state.selectedIds);
    newSelected.delete(id);
    const newHeroImages = new Map(state.heroImages);
    newHeroImages.delete(id);
    return {
      markets: state.markets.filter(m => m.id !== id),
      selectedIds: newSelected,
      heroImages: newHeroImages,
      selectedMarketId: state.selectedMarketId === id
        ? state.markets.find(m => m.id !== id)?.id ?? null
        : state.selectedMarketId,
    };
  }),

  clearAll: () => set({
    markets: [],
    selectedMarketId: null,
    selectedIds: new Set(),
    heroImages: new Map(),
    _heroPoolIndex: 0,
    previewOpen: false,
    previewIndex: 0,
  }),

  setSelectedMarket: (id) => set({ selectedMarketId: id }),

  toggleSelected: (id) => set(state => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedIds: newSelected };
  }),

  selectAll: () => set(state => ({
    selectedIds: new Set(state.markets.filter(m => m.status !== 'error' && m.availableViews.length > 0).map(m => m.id)),
  })),

  deselectAll: () => set({ selectedIds: new Set() }),

  setShareType: (type) => set({ shareType: type }),
  setVisualization: (type) => set({ visualization: type }),
  setShowKPI: (val) => set({ showKPI: val }),
  setShowSummary: (val) => set({ showSummary: val }),
  setPageTheme: (theme) => set({ pageTheme: theme }),
  setThemeConfig: (config) => set({ themeConfig: config }),
  setKPILayout: (layout) => set({ kpiLayout: layout }),

  openPreview: (index) => set({ previewOpen: true, previewIndex: index }),
  closePreview: () => set({ previewOpen: false }),

  navigatePreview: (direction) => set(state => {
    const readyMarkets = state.markets.filter(m => m.status !== 'error' && m.availableViews.length > 0);
    const maxIndex = readyMarkets.length - 1;
    if (maxIndex < 0) return {};
    let newIndex = state.previewIndex;
    if (direction === 'next') {
      newIndex = newIndex >= maxIndex ? 0 : newIndex + 1;
    } else {
      newIndex = newIndex <= 0 ? maxIndex : newIndex - 1;
    }
    return { previewIndex: newIndex };
  }),

  setHeroImage: (marketId, url) => set(state => {
    const newHeroImages = new Map(state.heroImages);
    const existing = newHeroImages.get(marketId);
    newHeroImages.set(marketId, { url, crop: existing?.crop ?? { ...DEFAULT_CROP } });
    return { heroImages: newHeroImages };
  }),

  setHeroCrop: (marketId, crop) => set(state => {
    const newHeroImages = new Map(state.heroImages);
    const existing = newHeroImages.get(marketId);
    if (existing) {
      newHeroImages.set(marketId, { ...existing, crop });
    }
    return { heroImages: newHeroImages };
  }),

  getHeroImage: (marketId) => {
    const state = get();
    return state.heroImages.get(marketId) ?? { url: '', crop: { ...DEFAULT_CROP } };
  },

  setExportFormat: (format) => set({ exportFormat: format }),
  setIsExporting: (val) => set({ isExporting: val }),
  setExportProgress: (val) => set({ exportProgress: val }),

  getSelectedMarkets: () => {
    const state = get();
    return state.markets.filter(m => state.selectedIds.has(m.id));
  },

  getReadyMarkets: () => {
    return get().markets.filter(m => m.status !== 'error' && m.availableViews.length > 0);
  },

  getCurrentMarket: () => {
    const state = get();
    return state.markets.find(m => m.id === state.selectedMarketId) ?? null;
  },

  getPreviewMarket: () => {
    const state = get();
    const readyMarkets = state.markets.filter(m => m.status !== 'error' && m.availableViews.length > 0);
    return readyMarkets[state.previewIndex] ?? null;
  },
}));
