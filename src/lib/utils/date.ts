export function formatDate(year: number, month: number, day: number): string {
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
} 