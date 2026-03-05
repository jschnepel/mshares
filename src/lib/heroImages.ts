/**
 * Monthly hero images — loaded from assets/{Month}/ via Vite glob import.
 * Each month's folder contains multiple JPEG options.
 * Falls back to Generic/ if the current month has no images.
 */

const imageModules = import.meta.glob<{ default: string }>(
  '/assets/**/*.jpeg',
  { eager: true },
);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Map of month index (0-11) → array of resolved image URLs */
const monthlyImages: Map<number, string[]> = new Map();
const genericImages: string[] = [];

for (const [path, mod] of Object.entries(imageModules)) {
  const url = mod.default;
  // Path format: /assets/January/foo.jpeg
  const parts = path.split('/');
  const folder = parts[2]; // e.g. "January", "Generic"

  if (folder === 'Generic') {
    genericImages.push(url);
    continue;
  }

  const monthIdx = MONTH_NAMES.indexOf(folder as typeof MONTH_NAMES[number]);
  if (monthIdx === -1) continue;

  if (!monthlyImages.has(monthIdx)) {
    monthlyImages.set(monthIdx, []);
  }
  monthlyImages.get(monthIdx)!.push(url);
}

/** Get all available hero images for a given month (0-11). Falls back to Generic. */
export function getMonthlyHeroImages(month?: number): string[] {
  const m = month ?? new Date().getMonth();
  const images = monthlyImages.get(m);
  if (images && images.length > 0) return images;
  return genericImages;
}

/** Pick a random hero image for the current (or specified) month. */
export function getRandomHeroImage(month?: number): string {
  const images = getMonthlyHeroImages(month);
  if (images.length === 0) return '';
  return images[Math.floor(Math.random() * images.length)];
}

/** Get total count of images for a month. */
export function getMonthImageCount(month?: number): number {
  return getMonthlyHeroImages(month).length;
}
