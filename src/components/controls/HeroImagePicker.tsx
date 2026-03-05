import { useState, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { getMonthlyHeroImages } from '@/lib/heroImages';
import { Image, ChevronLeft, ChevronRight, Move } from 'lucide-react';

interface HeroImagePickerProps {
  marketId: string;
}

export function HeroImagePicker({ marketId }: HeroImagePickerProps) {
  const { heroImages, setHeroImage, setHeroCrop, dateEnd } = useMarketStore();
  const heroState = heroImages.get(marketId) ?? { url: '', crop: { x: 50, y: 50 } };

  // Use end date's month for the gallery, otherwise current month
  let heroMonth: number | undefined;
  if (dateEnd) {
    const dm = dateEnd.match(/^(\d{2})\//);
    if (dm) heroMonth = parseInt(dm[1], 10) - 1;
  }
  const allImages = getMonthlyHeroImages(heroMonth);
  const currentIndex = allImages.indexOf(heroState.url);

  // Thumbnail gallery pagination
  const [galleryPage, setGalleryPage] = useState(0);
  const THUMBS_PER_PAGE = 6;
  const totalPages = Math.ceil(allImages.length / THUMBS_PER_PAGE);
  const pageImages = allImages.slice(galleryPage * THUMBS_PER_PAGE, (galleryPage + 1) * THUMBS_PER_PAGE);

  // Drag-to-crop state
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startCropX: number; startCropY: number } | null>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCropX: heroState.crop.x,
      startCropY: heroState.crop.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !cropAreaRef.current) return;
      const rect = cropAreaRef.current.getBoundingClientRect();
      // Convert pixel drag to percentage (inverted — dragging right moves image left, so focal point goes right)
      const dx = ((e.clientX - dragRef.current.startX) / rect.width) * -100;
      const dy = ((e.clientY - dragRef.current.startY) / rect.height) * -100;
      const newX = Math.max(0, Math.min(100, dragRef.current.startCropX + dx));
      const newY = Math.max(0, Math.min(100, dragRef.current.startCropY + dy));
      setHeroCrop(marketId, { x: Math.round(newX), y: Math.round(newY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [heroState.crop, marketId, setHeroCrop]);

  const selectImage = (url: string) => {
    setHeroImage(marketId, url);
  };

  const cycleImage = (direction: 'prev' | 'next') => {
    if (allImages.length === 0) return;
    let idx = currentIndex;
    if (direction === 'next') {
      idx = (idx + 1) % allImages.length;
    } else {
      idx = idx <= 0 ? allImages.length - 1 : idx - 1;
    }
    setHeroImage(marketId, allImages[idx]);
  };

  return (
    <div className="glass rounded-lg p-3">
      <span className="text-[10px] uppercase tracking-widest text-gold font-semibold mb-2.5 block">
        Hero Image
      </span>

      {/* Current image preview with drag-to-crop */}
      <div
        ref={cropAreaRef}
        className="relative w-full rounded-md overflow-hidden mb-2 group"
        style={{ aspectRatio: '16 / 7' }}
        onMouseDown={handleMouseDown}
      >
        {heroState.url ? (
          <img
            src={heroState.url}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${heroState.crop.x}% ${heroState.crop.y}%` }}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-navy-light flex items-center justify-center">
            <Image size={20} className="text-gray-muted" />
          </div>
        )}
        {/* Drag overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="bg-black/50 rounded-full p-1.5">
            <Move size={12} className="text-white" />
          </div>
        </div>
        <div className={`absolute inset-0 border-2 rounded-md transition-colors ${isDragging ? 'border-gold' : 'border-transparent group-hover:border-gold/40'}`}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />
      </div>

      {/* Prev/Next cycle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => cycleImage('prev')}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-muted hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[9px] text-gray-muted">
          {currentIndex >= 0 ? currentIndex + 1 : '?'} / {allImages.length}
        </span>
        <button
          onClick={() => cycleImage('next')}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-muted hover:text-cream hover:bg-navy-light/50 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Thumbnail gallery */}
      <div className="grid grid-cols-3 gap-1">
        {pageImages.map((url) => (
          <button
            key={url}
            onClick={() => selectImage(url)}
            className={`relative rounded overflow-hidden transition-all ${
              url === heroState.url
                ? 'ring-2 ring-gold ring-offset-1 ring-offset-navy-deep'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{ aspectRatio: '16 / 10' }}
          >
            <img
              src={url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Gallery pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setGalleryPage(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === galleryPage ? 'bg-gold w-3' : 'bg-navy-medium hover:bg-gray-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
