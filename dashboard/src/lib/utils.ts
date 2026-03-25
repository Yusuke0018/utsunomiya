/**
 * Format a Date object or date string as YYYY-MM-DD.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a Japanese-formatted month label, e.g. "2026年3月".
 */
export function getMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

/**
 * Generate an array of the past N months (including current) as options.
 * Ordered from most recent to oldest.
 */
export function getMonthOptions(
  count: number
): { year: number; month: number; label: string }[] {
  const options: { year: number; month: number; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    options.push({
      year,
      month,
      label: getMonthLabel(year, month),
    });
  }

  return options;
}

/**
 * Calculate percentage growth rate between two values.
 * Returns 0 when previous is 0 to avoid division by zero.
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * 12 distinct chart colors for category visualization.
 */
export const CATEGORY_COLORS: string[] = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
];
