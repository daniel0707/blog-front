/**
 * Format a date using Finnish locale with numeric values
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "15.1.2025")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('fi-FI', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
