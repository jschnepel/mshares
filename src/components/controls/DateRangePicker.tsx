import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateStr(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[1] - 1, +m[2]);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function inRange(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return day > start && day < end;
}

export function DateRangePicker() {
  const { dateStart, dateEnd, setDateRange } = useMarketStore();
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [hovered, setHovered] = useState<Date | null>(null);

  // Calendar view state — two months side by side
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Local working copies
  const [localStart, setLocalStart] = useState<Date | null>(null);
  const [localEnd, setLocalEnd] = useState<Date | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Sync store → local on open
  useEffect(() => {
    if (open) {
      const s = parseDate(dateStart);
      const e = parseDate(dateEnd);
      setLocalStart(s);
      setLocalEnd(e);
      setSelecting('start');
      if (s) {
        setViewYear(s.getFullYear());
        setViewMonth(s.getMonth());
      }
    }
  }, [open, dateStart, dateEnd]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = useCallback((day: Date) => {
    if (selecting === 'start') {
      setLocalStart(day);
      // If picked start is after current end, clear end
      if (localEnd && day >= localEnd) setLocalEnd(null);
      setSelecting('end');
    } else {
      // If picked end is before start, swap
      if (localStart && day < localStart) {
        setLocalEnd(localStart);
        setLocalStart(day);
      } else {
        setLocalEnd(day);
      }
      setSelecting('start');
    }
  }, [selecting, localStart, localEnd]);

  const apply = () => {
    setDateRange(
      localStart ? toDateStr(localStart) : '',
      localEnd ? toDateStr(localEnd) : '',
    );
    setOpen(false);
  };

  const clear = () => {
    setLocalStart(null);
    setLocalEnd(null);
    setDateRange('', '');
    setOpen(false);
  };

  const hasRange = dateStart && dateEnd;

  // Determine the visual range end for hover preview
  const rangeEnd = selecting === 'end' && localStart && hovered && hovered > localStart
    ? hovered
    : localEnd;

  return (
    <div className="relative" ref={panelRef}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${hasRange
            ? 'bg-gold/20 text-gold border border-gold/30'
            : 'text-gray-muted hover:text-cream hover:bg-navy-light border border-transparent'
          }`}
      >
        <Calendar size={14} />
        {hasRange ? `${dateStart} — ${dateEnd}` : 'Date Range'}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-navy-deep border border-navy-medium rounded-xl shadow-2xl p-4 w-[300px]">
          {/* Selecting indicator */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setSelecting('start')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                selecting === 'start'
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-gray-muted border border-transparent hover:text-cream'
              }`}
            >
              {localStart ? toDateStr(localStart) : 'Start Date'}
            </button>
            <span className="text-gray-muted text-xs">—</span>
            <button
              onClick={() => setSelecting('end')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                selecting === 'end'
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-gray-muted border border-transparent hover:text-cream'
              }`}
            >
              {localEnd ? toDateStr(localEnd) : 'End Date'}
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-muted hover:text-cream hover:bg-navy-light transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm text-cream font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-muted hover:text-cream hover:bg-navy-light transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-gray-muted font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <MonthGrid
            year={viewYear}
            month={viewMonth}
            start={localStart}
            end={rangeEnd}
            onSelect={handleDayClick}
            onHover={setHovered}
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-medium/50">
            <button onClick={clear} className="text-xs text-gray-muted hover:text-cream transition-colors">
              Clear
            </button>
            <button
              onClick={apply}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gold/15 text-gold hover:bg-gold/25 border border-gold/20 transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  year, month, start, end, onSelect, onHover,
}: {
  year: number;
  month: number;
  start: Date | null;
  end: Date | null;
  onSelect: (d: Date) => void;
  onHover: (d: Date | null) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (Date | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="grid grid-cols-7" onMouseLeave={() => onHover(null)}>
      {cells.map((day, i) => {
        if (!day) return <div key={`empty-${i}`} className="h-8" />;

        const isStart = start && sameDay(day, start);
        const isEnd = end && sameDay(day, end);
        const isInRange = inRange(day, start, end);
        const isSelected = isStart || isEnd;

        return (
          <button
            key={day.getDate()}
            onClick={() => onSelect(day)}
            onMouseEnter={() => onHover(day)}
            className={`h-8 text-xs rounded-md transition-all
              ${isSelected
                ? 'bg-gold text-navy-deep font-bold'
                : isInRange
                  ? 'bg-gold/15 text-gold'
                  : 'text-cream/70 hover:bg-navy-light hover:text-cream'
              }`}
          >
            {day.getDate()}
          </button>
        );
      })}
    </div>
  );
}
