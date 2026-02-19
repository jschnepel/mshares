import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';

const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { addFiles, isProcessing } = useMarketStore();

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(isAcceptedFile);
    if (files.length > 0) {
      await addFiles(files);
    }
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFiles(files);
    };
    input.click();
  }, [handleFiles]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed
        transition-all duration-300 ease-out
        ${isDragging
          ? 'drop-zone-active border-gold bg-gold/5 scale-[1.01]'
          : 'border-navy-medium hover:border-gold/40 bg-navy-light/30 hover:bg-navy-light/50'
        }
        ${isProcessing ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <div className="flex flex-col items-center justify-center py-10 px-6">
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center mb-4
          ${isDragging ? 'bg-gold/20 text-gold' : 'bg-navy-medium/50 text-gray-muted'}
          transition-all duration-300
        `}>
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          ) : isDragging ? (
            <FileSpreadsheet size={24} />
          ) : (
            <Upload size={24} />
          )}
        </div>

        <p className="text-cream/90 font-medium text-sm mb-1">
          {isProcessing
            ? 'Processing files...'
            : isDragging
              ? 'Drop files here'
              : 'Drop market share files here'
          }
        </p>
        <p className="text-gray-muted text-xs">
          CSV, Excel (.xlsx, .xls) — Batch upload supported
        </p>
      </div>
    </div>
  );
}
