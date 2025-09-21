import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse date string (YYYY-MM-DD) to local date without timezone conversion
export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Format date to YYYY-MM-DD string without timezone conversion
export function formatDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
