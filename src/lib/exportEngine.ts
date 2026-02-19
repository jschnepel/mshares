import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { MarketData, ShareType, ExportFormat } from '@/types';
import { CHART_EXPORT, DEVELOPER_CONTACT } from './constants';

/**
 * Renders an offscreen chart canvas and returns a data URL.
 * The chart component must be rendered into a hidden div at export dimensions.
 */
export async function captureChartCanvas(
  containerId: string,
): Promise<string | null> {
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Look for a canvas element (Chart.js) or SVG (D3)
  const canvas = container.querySelector('canvas');
  if (canvas) {
    return canvas.toDataURL('image/png', 1.0);
  }

  // For SVG-based charts (treemap, sankey), convert to canvas
  const svg = container.querySelector('svg');
  if (svg) {
    return svgToDataUrl(svg);
  }

  return null;
}

async function svgToDataUrl(svg: SVGSVGElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CHART_EXPORT.width;
      canvas.height = CHART_EXPORT.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG'));
    };
    img.src = url;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png';
  const bstr = atob(parts[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

export async function exportAsPNG(
  dataUrl: string,
  fileName: string,
): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  if (blob.size < 1000) {
    throw new Error(`PNG export too small (${blob.size} bytes). ${DEVELOPER_CONTACT.message}`);
  }
  saveAs(blob, `${fileName}.png`);
}

export async function exportAsPDF(
  dataUrl: string,
  fileName: string,
  _marketName: string,
): Promise<Blob> {
  // Letter size (8.5 x 11 in) — the branded page image fills the whole page
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();   // 8.5
  const pageHeight = pdf.internal.pageSize.getHeight();  // 11

  // Full-bleed: image fills entire page
  pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

  const blob = pdf.output('blob');
  if (fileName) {
    saveAs(blob, `${fileName}.pdf`);
  }
  return blob;
}

export interface BatchExportItem {
  market: MarketData;
  shareType: ShareType;
  chartDataUrl: string;
}

export async function exportBatchAsZip(
  items: BatchExportItem[],
  format: ExportFormat,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();
  const total = items.length * (format === 'both' ? 2 : 1);
  let current = 0;

  for (const item of items) {
    const safeName = item.market.marketName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');

    if (format === 'png' || format === 'both') {
      const blob = dataUrlToBlob(item.chartDataUrl);
      zip.file(`${safeName}.png`, blob, { compression: 'STORE' });
      current++;
      onProgress?.(current, total);
    }

    if (format === 'pdf' || format === 'both') {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(item.chartDataUrl, 'PNG', 0, 0, pageWidth, pageHeight);

      const pdfBlob = pdf.output('blob');
      zip.file(`${safeName}.pdf`, pdfBlob, { compression: 'STORE' });
      current++;
      onProgress?.(current, total);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE',
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(zipBlob, `RLSIR-Market-Reports-${dateStr}.zip`);
}
