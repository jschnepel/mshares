import { create } from 'zustand';
import type { MarketData, ShareType, VisualizationType, ExportFormat, PageTheme } from '@/types';
import { processFiles } from '@/lib/fileProcessor';

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
  openPreview: (index: number) => void;
  closePreview: () => void;
  navigatePreview: (direction: 'prev' | 'next') => void;
  setExportFormat: (format: ExportFormat) => void;
  setIsExporting: (val: boolean) => void;
  setExportProgress: (val: number) => void;

  // Computed
  getSelectedMarkets: () => MarketData[];
  getReadyMarkets: () => MarketData[];
  getCurrentMarket: () => MarketData | null;
  getPreviewMarket: () => MarketData | null;
}

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
        results.forEach(m => {
          if (m.status !== 'error' && m.availableViews.length > 0) {
            newSelected.add(m.id);
          }
        });
        return {
          markets: newMarkets,
          selectedIds: newSelected,
          selectedMarketId: state.selectedMarketId ?? results.find(m => m.status !== 'error')?.id ?? null,
        };
      });
    } finally {
      set({ isProcessing: false });
    }
  },

  setDateRange: (start, end) => set({ dateStart: start, dateEnd: end }),

  updateMarketTitle: (id, title) => set(state => ({
    markets: state.markets.map(m => m.id === id ? { ...m, chartTitle: title || undefined } : m),
  })),

  removeMarket: (id) => set(state => {
    const newSelected = new Set(state.selectedIds);
    newSelected.delete(id);
    return {
      markets: state.markets.filter(m => m.id !== id),
      selectedIds: newSelected,
      selectedMarketId: state.selectedMarketId === id
        ? state.markets.find(m => m.id !== id)?.id ?? null
        : state.selectedMarketId,
    };
  }),

  clearAll: () => set({
    markets: [],
    selectedMarketId: null,
    selectedIds: new Set(),
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
