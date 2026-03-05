import { useCallback, useState, useRef, useMemo } from 'react';
import { BarChart3, Wrench, LayoutDashboard, FileText, FileSpreadsheet, Lock, Upload, ArrowRight } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { TEMPLATE_REGISTRY, type TemplateDefinition } from '@/lib/templateRegistry';
import { getMonthlyHeroImages } from '@/lib/heroImages';
import type { TemplateId } from '@/types';

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

const ICON_MAP: Record<TemplateId, typeof BarChart3> = {
  'market-share': BarChart3,
  'custom-chart': Wrench,
  'comparison-dashboard': LayoutDashboard,
  'quick-summary': FileText,
};

function TemplateCard({ template, heroUrl }: { template: TemplateDefinition; heroUrl: string }) {
  const ingestFiles = useProjectStore(s => s.ingestFiles);
  const navigateToWorkspace = useProjectStore(s => s.navigateToWorkspace);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = ICON_MAP[template.id] ?? FileText;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!template.isAvailable) return;
    const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
    if (files.length > 0) {
      ingestFiles(files, template.id);
    }
  }, [template.id, template.isAvailable, ingestFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (template.isAvailable) setIsDragging(true);
  }, [template.isAvailable]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!template.isAvailable) return;
    setProjectName(`New ${template.name}`);
    navigateToWorkspace(template.id);
  }, [template.id, template.name, template.isAvailable, navigateToWorkspace, setProjectName]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isAcceptedFile);
    if (files.length > 0) {
      ingestFiles(files, template.id);
    }
    e.target.value = '';
  }, [template.id, ingestFiles]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300
        ${!template.isAvailable
          ? 'opacity-50 cursor-default'
          : isDragging
            ? 'scale-[1.03] ring-2 ring-gold'
            : 'hover:scale-[1.02] cursor-pointer'
        }`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {/* Hero background */}
      <img
        src={heroUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 group-hover:from-black/90 transition-all duration-300" />

      {/* Lock badge for unavailable */}
      {!template.isAvailable && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          <Lock size={10} className="text-white/50" />
          <span className="text-[9px] text-white/50 font-medium uppercase tracking-wider">Coming Soon</span>
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gold/10 backdrop-blur-[2px]">
          <FileSpreadsheet size={40} className="text-gold" />
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Icon size={16} className="text-gold" />
          </div>
          <h3 className="font-serif text-lg text-white font-semibold">{template.name}</h3>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed mb-3 pl-[42px]">{template.description}</p>

        {/* Action row */}
        {template.isAvailable && (
          <div className="flex items-center gap-2 pl-[42px]">
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium
                text-white/70 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-sm
                border border-white/10 transition-all"
            >
              <Upload size={11} />
              Upload
            </button>
            <button
              onClick={handleClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium
                text-gold hover:text-gold bg-gold/10 hover:bg-gold/20
                border border-gold/20 transition-all"
            >
              Open
              <ArrowRight size={11} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple={template.id === 'market-share'}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateGallery() {
  const loadProject = useProjectStore(s => s.loadProject);
  const loadInputRef = useRef<HTMLInputElement>(null);

  // Pick 4 distinct hero images for the cards
  const cardImages = useMemo(() => {
    const pool = getMonthlyHeroImages();
    if (pool.length === 0) return ['', '', '', ''];
    return [0, 1, 2, 3].map(i => pool[i % pool.length]);
  }, []);

  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadProject(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadProject]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-navy-deep relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[0.03] blur-[120px] pointer-events-none" />

      {/* Heading */}
      <div className="text-center mb-8 relative z-10">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold/40 font-medium mb-3">
          Russ Lyon Sotheby's International Realty
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-cream/90 font-bold tracking-tight">
          Market Analytics Builder
        </h1>
        <div className="mx-auto mt-3 w-12 h-[2px] bg-gold/30 rounded-full" />
      </div>

      {/* Template grid — 2×2 */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl w-full px-6 relative z-10">
        {TEMPLATE_REGISTRY.map((t, i) => (
          <TemplateCard key={t.id} template={t} heroUrl={cardImages[i]} />
        ))}
      </div>

      {/* Load project */}
      <div className="mt-6 relative z-10">
        <button
          onClick={() => loadInputRef.current?.click()}
          className="text-[11px] text-gray-muted hover:text-cream underline underline-offset-2 transition-colors"
        >
          Open a saved project (.lex.json)
        </button>
        <input
          ref={loadInputRef}
          type="file"
          accept=".json,.lex.json"
          onChange={handleLoadProject}
          className="hidden"
        />
      </div>

      {/* Signature */}
      <span className="absolute bottom-4 right-6 text-[9px] text-cream/20 select-none">
        Joey Schnepel
      </span>
    </div>
  );
}
