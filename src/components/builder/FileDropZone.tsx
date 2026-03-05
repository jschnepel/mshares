import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useBuilderStore } from '@/store/builderStore';

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function isAccepted(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const loadFile = useBuilderStore(s => s.loadFile);
  const isLoading = useBuilderStore(s => s.isLoading);

  const handleFile = useCallback(async (fileList: FileList | File[]) => {
    const file = Array.from(fileList).find(isAccepted);
    if (file) await loadFile(file);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFile(files);
    };
    input.click();
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
      onClick={handleClick}
      className={`
        cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
        ${isDragging
          ? 'border-gold bg-gold/5 scale-[1.01]'
          : 'border-navy-medium hover:border-gold/40 bg-navy-light/20 hover:bg-navy-light/30'
        }
        ${isLoading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-5
          ${isDragging ? 'bg-gold/20 text-gold' : 'bg-navy-medium/50 text-gray-muted'}
          transition-all duration-300
        `}>
          {isLoading ? (
            <Loader2 size={28} className="animate-spin text-gold" />
          ) : isDragging ? (
            <FileSpreadsheet size={28} />
          ) : (
            <Upload size={28} />
          )}
        </div>

        <p className="text-cream/90 font-medium text-base mb-1.5">
          {isLoading ? 'Processing...' : isDragging ? 'Drop file here' : 'Drop your data file here'}
        </p>
        <p className="text-gray-muted text-sm">
          CSV, Excel (.xlsx, .xls)
        </p>
      </div>
    </div>
  );
}
