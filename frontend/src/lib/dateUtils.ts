import { TimeFormat } from '@/types/api'

/**
 * Format date and time with configurable time format preference
 * @param date - Date object, date string, or null
 * @param timeFormat - TimeFormat enum (12h or 24h)
 * @returns Formatted date string
 */
export const formatDateTime = (
  date: Date | string | null, 
  timeFormat: TimeFormat = TimeFormat.TWENTY_FOUR_HOUR
): string => {
  if (!date) return 'Unknown date'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = timeFormat === TimeFormat.TWELVE_HOUR 
    ? { hour: '2-digit', minute: '2-digit', hour12: true }
    : { hour: '2-digit', minute: '2-digit', hour12: false }
  
  const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions)
  const formattedTime = dateObj.toLocaleTimeString('en-US', timeOptions)
  
  return `${formattedDate} ${formattedTime}`
}

/**
 * Format only the date part
 * @param date - Date object, date string, or null
 * @returns Formatted date string (no time)
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return 'Unknown date'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format only the time part
 * @param date - Date object, date string, or null
 * @param timeFormat - TimeFormat enum (12h or 24h)
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string | null,
  timeFormat: TimeFormat = TimeFormat.TWENTY_FOUR_HOUR
): string => {
  if (!date) return '--:--'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const timeOptions: Intl.DateTimeFormatOptions = timeFormat === TimeFormat.TWELVE_HOUR 
    ? { hour: '2-digit', minute: '2-digit', hour12: true }
    : { hour: '2-digit', minute: '2-digit', hour12: false }
  
  return dateObj.toLocaleTimeString('en-US', timeOptions)
}

/**
 * Extract timestamp from PaparazziUAV filename format: YY_MM_DD__HH_MM_SS.ext
 * @param filename - The filename to parse
 * @returns Date object or null if parsing fails
 */
export const extractTimestampFromFilename = (filename: string): Date | null => {
  const regex = /(\d{2})_(\d{2})_(\d{2})__(\d{2})_(\d{2})_(\d{2})/
  const match = filename.match(regex)
  
  if (!match) return null
  
  const [, year, month, day, hour, minute, second] = match
  const fullYear = 2000 + parseInt(year) // Convert YY to 20YY
  
  try {
    return new Date(fullYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second))
  } catch {
    return null
  }
}
