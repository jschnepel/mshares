import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { useBuilderStore } from '@/store/builderStore';
import { BrandedChartPage } from './BrandedChartPage';

export function ExportButton() {
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);
  const labelColumn = useBuilderStore(s => s.labelColumn);
  const valueColumns = useBuilderStore(s => s.valueColumns);
  const chartType = useBuilderStore(s => s.chartType);
  const chartTitle = useBuilderStore(s => s.chartTitle);
  const seriesColors = useBuilderStore(s => s.seriesColors);
  const showDataLabels = useBuilderStore(s => s.showDataLabels);
  const showLegend = useBuilderStore(s => s.showLegend);
  const bgColor = useBuilderStore(s => s.bgColor);
  const getChartData = useBuilderStore(s => s.getChartData);

  const disabled = labelColumn === null || valueColumns.length === 0 ||
    (chartType === 'scatter' && valueColumns.length < 2);

  const doExport = useCallback(async (format: 'png' | 'pdf') => {
    setExporting(format);
    try {
      // Create offscreen container
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:600px;height:776px;';
      document.body.appendChild(container);

      const chartData = getChartData();

      // Render branded page
      const root = createRoot(container);
      root.render(
        <BrandedChartPage
          chartData={chartData}
          chartType={chartType}
          chartTitle={chartTitle}
          valueColumns={valueColumns}
          seriesColors={seriesColors}
          showDataLabels={showDataLabels}
          showLegend={showLegend}
          bgColor={bgColor}
        />
      );

      // Wait for Chart.js to render
      await new Promise(r => setTimeout(r, 1500));

      // Capture
      const canvas = await html2canvas(container, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#0a1628',
        logging: false,
      });

      const safeName = (chartTitle || 'chart').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'png') {
        canvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);
        pdf.save(`${safeName}.pdf`);
      }

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [chartType, chartTitle, valueColumns, seriesColors, showDataLabels, showLegend, bgColor, getChartData]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => doExport('png')}
        disabled={disabled || exporting !== null}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
          ${disabled
            ? 'text-gray-muted/40 border border-navy-medium/30 cursor-not-allowed'
            : 'text-cream bg-navy-light/50 hover:bg-navy-light border border-navy-medium hover:border-gold/30'
          }
        `}
      >
        {exporting === 'png' ? <Loader2 size={14} className="animate-spin" /> : <FileImage size={14} />}
        Export PNG
      </button>
      <button
        onClick={() => doExport('pdf')}
        disabled={disabled || exporting !== null}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
          ${disabled
            ? 'text-gray-muted/40 border border-navy-medium/30 cursor-not-allowed'
            : 'text-cream bg-navy-light/50 hover:bg-navy-light border border-navy-medium hover:border-gold/30'
          }
        `}
      >
        {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        Export PDF
      </button>
    </div>
  );
}
