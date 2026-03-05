import { create } from 'zustand';
import type {
  ParsedWorkbook,
  ParsedSheet,
  SimpleChartType,
  ColumnDataType,
} from '@/types';
import { parseGenericFile } from '@/lib/genericParser';
import { safeFloat } from '@/lib/utils';

function maxValues(type: SimpleChartType): number {
  if (type === 'pie' || type === 'donut') return 1;
  if (type === 'scatter') return 2;
  return 6;
}

function autoMap(sheet: ParsedSheet | undefined): { labelColumn: number | null; valueColumns: number[] } {
  if (!sheet) return { labelColumn: null, valueColumns: [] };
  let labelCol: number | null = null;
  let valueCol: number | null = null;
  for (const col of sheet.columns) {
    if (labelCol === null && (col.dataType === 'string' || col.dataType === 'date')) labelCol = col.index;
    if (valueCol === null && (['integer', 'float', 'percentage', 'currency'] as ColumnDataType[]).includes(col.dataType)) valueCol = col.index;
    if (labelCol !== null && valueCol !== null) break;
  }
  return { labelColumn: labelCol, valueColumns: valueCol !== null ? [valueCol] : [] };
}

export interface SimpleChartData {
  labels: string[];
  datasets: { name: string; values: number[]; dataType: ColumnDataType }[];
}

interface BuilderStore {
  workbook: ParsedWorkbook | null;
  isLoading: boolean;
  error: string | null;
  activeSheetIndex: number;
  labelColumn: number | null;
  valueColumns: number[];
  chartType: SimpleChartType;
  chartTitle: string;
  seriesColors: Record<number, string>;
  showDataLabels: boolean;
  showLegend: boolean;
  bgColor: string;

  // Actions
  loadFile: (file: File) => Promise<void>;
  clearWorkbook: () => void;
  setActiveSheet: (index: number) => void;
  setLabelColumn: (index: number | null) => void;
  toggleValueColumn: (index: number) => void;
  setChartType: (type: SimpleChartType) => void;
  setChartTitle: (title: string) => void;
  setSeriesColor: (colIndex: number, color: string) => void;
  setShowDataLabels: (v: boolean) => void;
  setShowLegend: (v: boolean) => void;
  setBgColor: (color: string) => void;
  restoreConfig: (config: {
    chartType: SimpleChartType;
    labelColumn: number | null;
    valueColumns: number[];
    chartTitle: string;
    seriesColors: Record<number, string>;
    showDataLabels: boolean;
    showLegend: boolean;
    bgColor: string;
  }) => void;

  // Computed
  getActiveSheet: () => ParsedSheet | null;
  getChartData: () => SimpleChartData;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  workbook: null,
  isLoading: false,
  error: null,
  activeSheetIndex: 0,
  labelColumn: null,
  valueColumns: [],
  chartType: 'bar',
  chartTitle: '',
  seriesColors: {},
  showDataLabels: true,
  showLegend: true,
  bgColor: '#0a1628',

  loadFile: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const workbook = await parseGenericFile(file);
      const sheet = workbook.sheets[workbook.activeSheetIndex];
      const mapped = autoMap(sheet);
      set({
        workbook,
        isLoading: false,
        activeSheetIndex: workbook.activeSheetIndex,
        labelColumn: mapped.labelColumn,
        valueColumns: mapped.valueColumns,
        chartTitle: file.name.replace(/\.(csv|xlsx?|xls)$/i, ''),
        seriesColors: {},
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Failed to parse file' });
    }
  },

  clearWorkbook: () => set({
    workbook: null,
    error: null,
    activeSheetIndex: 0,
    labelColumn: null,
    valueColumns: [],
    chartTitle: '',
    seriesColors: {},
    showDataLabels: true,
    showLegend: true,
    bgColor: '#0a1628',
  }),

  setActiveSheet: (index) => set(state => {
    if (!state.workbook) return {};
    const sheet = state.workbook.sheets[index];
    const mapped = autoMap(sheet);
    return {
      activeSheetIndex: index,
      labelColumn: mapped.labelColumn,
      valueColumns: mapped.valueColumns,
      seriesColors: {},
    };
  }),

  setLabelColumn: (index) => set(state => ({
    labelColumn: index,
    valueColumns: index !== null ? state.valueColumns.filter(i => i !== index) : state.valueColumns,
  })),

  toggleValueColumn: (index) => set(state => {
    if (index === state.labelColumn) return {};
    if (state.valueColumns.includes(index)) {
      return { valueColumns: state.valueColumns.filter(i => i !== index) };
    }
    const max = maxValues(state.chartType);
    if (state.valueColumns.length >= max) return {};
    return { valueColumns: [...state.valueColumns, index] };
  }),

  setChartType: (type) => set(state => {
    const max = maxValues(type);
    return {
      chartType: type,
      valueColumns: state.valueColumns.slice(0, max),
    };
  }),

  setChartTitle: (title) => set({ chartTitle: title }),

  setSeriesColor: (colIndex, color) => set(state => ({
    seriesColors: { ...state.seriesColors, [colIndex]: color },
  })),

  setShowDataLabels: (v) => set({ showDataLabels: v }),
  setShowLegend: (v) => set({ showLegend: v }),
  setBgColor: (color) => set({ bgColor: color }),

  restoreConfig: (config) => set({
    chartType: config.chartType,
    labelColumn: config.labelColumn,
    valueColumns: config.valueColumns,
    chartTitle: config.chartTitle,
    seriesColors: config.seriesColors,
    showDataLabels: config.showDataLabels,
    showLegend: config.showLegend,
    bgColor: config.bgColor,
  }),

  getActiveSheet: () => {
    const { workbook, activeSheetIndex } = get();
    if (!workbook) return null;
    return workbook.sheets[activeSheetIndex] ?? null;
  },

  getChartData: () => {
    const { labelColumn, valueColumns, activeSheetIndex, workbook } = get();
    const empty: SimpleChartData = { labels: [], datasets: [] };
    if (!workbook) return empty;
    const sheet = workbook.sheets[activeSheetIndex];
    if (!sheet || labelColumn === null || valueColumns.length === 0) return empty;

    const includedRows = sheet.rows.filter(r => r.included);
    const valCols = valueColumns.map(idx => sheet.columns[idx]).filter(Boolean);
    if (valCols.length === 0) return empty;

    const rows: { label: string; values: number[] }[] = [];
    for (const row of includedRows) {
      const rawLabel = sheet.rawData[row.index]?.[labelColumn];
      const label = String(rawLabel ?? '').trim();
      if (!label) continue;
      rows.push({
        label: label.length > 30 ? label.slice(0, 29) + '\u2026' : label,
        values: valueColumns.map(idx => safeFloat(sheet.rawData[row.index]?.[idx])),
      });
    }

    // Sort descending by first value (non-date labels)
    const labelColMeta = sheet.columns[labelColumn];
    if (labelColMeta?.dataType !== 'date') {
      rows.sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
    }

    return {
      labels: rows.map(r => r.label),
      datasets: valCols.map((col, di) => ({
        name: col.displayName,
        values: rows.map(r => r.values[di] ?? 0),
        dataType: col.dataType,
      })),
    };
  },
}));
