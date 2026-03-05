import type { ProjectState, TemplateId } from '@/types';
import { useMarketStore } from '@/store/marketStore';
import { useBuilderStore } from '@/store/builderStore';

let projectCounter = 0;

function generateProjectId(): string {
  return `proj-${Date.now()}-${++projectCounter}`;
}

export function serializeProject(templateId: TemplateId, projectName: string): ProjectState {
  const project: ProjectState = {
    id: generateProjectId(),
    templateId,
    name: projectName,
    fileName: null,
    sheetIndex: 0,
    createdAt: Date.now(),
    lastModifiedAt: Date.now(),
  };

  if (templateId === 'market-share') {
    const ms = useMarketStore.getState();
    project.fileName = ms.markets[0]?.fileName ?? null;
    project.marketShareConfig = {
      shareType: ms.shareType,
      visualization: ms.visualization,
      showKPI: ms.showKPI,
      showSummary: ms.showSummary,
      pageTheme: ms.pageTheme,
      themeConfig: ms.themeConfig,
      dateStart: ms.dateStart,
      dateEnd: ms.dateEnd,
    };
  } else if (templateId === 'custom-chart') {
    const bs = useBuilderStore.getState();
    project.fileName = bs.workbook?.fileName ?? null;
    project.sheetIndex = bs.activeSheetIndex;
    project.customChartConfig = {
      chartType: bs.chartType,
      labelColumn: bs.labelColumn,
      valueColumns: bs.valueColumns,
      chartTitle: bs.chartTitle,
      seriesColors: bs.seriesColors,
      showDataLabels: bs.showDataLabels,
      showLegend: bs.showLegend,
      bgColor: bs.bgColor,
    };
  }

  return project;
}

export function downloadProjectJson(project: ProjectState): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.lex.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseProjectJson(json: string): ProjectState | null {
  try {
    const obj = JSON.parse(json);
    if (!obj.templateId || !obj.name) return null;
    return obj as ProjectState;
  } catch {
    return null;
  }
}

export function restoreProjectConfig(project: ProjectState): void {
  if (project.templateId === 'market-share' && project.marketShareConfig) {
    const ms = useMarketStore.getState();
    const c = project.marketShareConfig;
    ms.setShareType(c.shareType);
    ms.setVisualization(c.visualization);
    ms.setShowKPI(c.showKPI);
    ms.setShowSummary(c.showSummary);
    ms.setPageTheme(c.pageTheme);
    ms.setThemeConfig(c.themeConfig);
    ms.setDateRange(c.dateStart, c.dateEnd);
  } else if (project.templateId === 'custom-chart' && project.customChartConfig) {
    const bs = useBuilderStore.getState();
    bs.restoreConfig(project.customChartConfig);
  }
}
