/** Safely parse a value to a float, stripping $, %, commas. Returns 0 for unparseable values. */
export function safeFloat(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).replace(/[$,%]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/** Scale a base font size proportional to canvas width. Reference width: 550px. */
export function scaledFont(base: number, canvasWidth: number): number {
  const s = Math.max(0.65, Math.min(1.25, canvasWidth / 550));
  return Math.round(base * s);
}

/** Abbreviate a date string for X-axis labels: "Jan '24", "Feb '24" etc. */
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yr = String(d.getFullYear()).slice(-2);
  return `${months[d.getMonth()]} '${yr}`;
}

/** Parse a date string to a sortable timestamp. Returns NaN if unparseable. */
export function parseDateToTimestamp(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getTime();
}

type DateGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

/** Parse a flexible date string into a Date. Accepts ISO, "1/5/24", "Jan 5 2024", etc. Returns null if unparseable. */
export function parseFlexibleDate(input: string): Date | null {
  if (!input || !input.trim()) return null;
  const s = input.trim();

  // Try native parse first (handles ISO, "Jan 5 2024", etc.)
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;

  // Try M/D/YY or M/D/YYYY
  const slashMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/** Format a Date to "Jan 5, 2024" display format. */
export function formatDisplayDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Bucket a date string into a label based on granularity. */
export function bucketDateLabel(dateStr: string, granularity: DateGranularity): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const y = d.getFullYear();

  switch (granularity) {
    case 'day':
      return `${months[d.getMonth()]} ${d.getDate()}, ${y}`;
    case 'week': {
      // ISO week number
      const jan1 = new Date(y, 0, 1);
      const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
      const week = Math.ceil((days + jan1.getDay() + 1) / 7);
      return `Week ${week}, ${y}`;
    }
    case 'month':
      return `${months[d.getMonth()]} ${y}`;
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q} ${y}`;
    }
    case 'year':
      return String(y);
  }
}

/** Auto-select granularity based on data span in days. */
export function autoGranularity(spanDays: number): DateGranularity {
  if (spanDays < 14) return 'day';
  if (spanDays < 90) return 'week';
  if (spanDays < 730) return 'month';  // ~2 years
  if (spanDays < 1825) return 'quarter'; // ~5 years
  return 'year';
}

/** Format a numeric value based on its detected column data type. */
export function formatValue(val: number, dataType: string): string {
  switch (dataType) {
    case 'currency': return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    case 'percentage': return `${val.toFixed(1)}%`;
    case 'integer': return Math.round(val).toLocaleString('en-US');
    default: return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}
