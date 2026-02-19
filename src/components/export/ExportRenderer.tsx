import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import { BrandedPage, HERO_IMAGES } from '@/components/charts/ChartView';
import type { MarketData, ShareType, ExportFormat, VisualizationType, PageTheme } from '@/types';
import {
  exportAsPNG,
  exportAsPDF,
  exportBatchAsZip,
  type BatchExportItem,
} from '@/lib/exportEngine';

/**
 * WYSIWYG export: render at the same size as the preview (600px wide, 8.5:11 ratio),
 * then capture at 3x scale for high-resolution output (~1800×2330 px).
 */
const RENDER_WIDTH = 600;
const RENDER_HEIGHT = Math.round(RENDER_WIDTH * (11 / 8.5)); // 776

export interface ExportConfig {
  visualization: VisualizationType;
  showKPI: boolean;
  showSummary: boolean;
  pageTheme: PageTheme;
}

/**
 * Preload an image and return a promise that resolves when loaded.
 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't block export on image failure
    img.src = src;
  });
}

/**
 * Renders the full branded page offscreen at preview dimensions, captures at 3x.
 */
async function renderAndCapture(
  market: MarketData,
  shareType: ShareType,
  config: ExportConfig,
): Promise<string> {
  const heroUrl = HERO_IMAGES[new Date().getMonth()];
  const bgColor = config.pageTheme === 'dark' ? '#002349' : '#ffffff';

  // Preload the hero image to avoid blank captures
  await preloadImage(heroUrl);

  // Create hidden container at preview dimensions
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px;
    overflow: hidden; background: ${bgColor}; z-index: -1;
  `;
  document.body.appendChild(container);

  // Render the branded page at its natural preview size (WYSIWYG)
  const root = createRoot(container);
  root.render(
    <BrandedPage
      market={market}
      shareType={shareType}
      visualization={config.visualization}
      heroUrl={heroUrl}
      showKPI={config.showKPI}
      showSummary={config.showSummary}
      pageTheme={config.pageTheme}
    />
  );

  // Wait for React render + Chart.js animation (disabled in branded mode) + image paint
  await new Promise(r => setTimeout(r, 2000));

  // Capture at 3x scale for high-resolution output
  const canvas = await html2canvas(container, {
    width: RENDER_WIDTH,
    height: RENDER_HEIGHT,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: bgColor,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  // Cleanup
  root.unmount();
  document.body.removeChild(container);

  return dataUrl;
}

/**
 * Export a single market report.
 */
export async function exportSingleReport(
  market: MarketData,
  shareType: ShareType,
  format: ExportFormat,
  config?: ExportConfig,
): Promise<void> {
  const exportConfig = config ?? { visualization: 'bar', showKPI: false, showSummary: false, pageTheme: 'light' as PageTheme };
  const dataUrl = await renderAndCapture(market, shareType, exportConfig);
  const safeName = market.marketName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
  const fileName = `RLSIR-${safeName}`;

  if (format === 'png' || format === 'both') {
    await exportAsPNG(dataUrl, fileName);
  }
  if (format === 'pdf' || format === 'both') {
    await exportAsPDF(dataUrl, fileName, market.marketName);
  }
}

/**
 * Export multiple market reports as a ZIP.
 */
export async function exportBatchReports(
  markets: MarketData[],
  shareType: ShareType,
  format: ExportFormat,
  onProgress?: (current: number, total: number) => void,
  config?: ExportConfig,
): Promise<void> {
  const exportConfig = config ?? { visualization: 'bar', showKPI: false, showSummary: false, pageTheme: 'light' as PageTheme };
  const items: BatchExportItem[] = [];

  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const marketShareType = market.availableViews.includes(shareType)
      ? shareType
      : market.availableViews[0];

    if (!marketShareType) continue;

    const chartDataUrl = await renderAndCapture(market, marketShareType, exportConfig);
    items.push({ market, shareType: marketShareType, chartDataUrl });
    onProgress?.(i + 1, markets.length);
  }

  if (items.length === 0) {
    throw new Error('No charts to export');
  }

  if (items.length === 1) {
    const item = items[0];
    const safeName = item.market.marketName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const fileName = `RLSIR-${safeName}`;

    if (format === 'png' || format === 'both') {
      await exportAsPNG(item.chartDataUrl, fileName);
    }
    if (format === 'pdf' || format === 'both') {
      await exportAsPDF(item.chartDataUrl, fileName, item.market.marketName);
    }
    return;
  }

  await exportBatchAsZip(items, format);
}
