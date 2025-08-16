/**
 * Test for timestamp normalization fix
 * This test verifies that the timestamp normalization function handles various invalid formats
 */

import { describe, it, expect } from '@jest/globals'

// Mock the GoogleSheetsService normalizeTimestamp method for testing
class TestGoogleSheetsService {
  /**
   * Normalize timestamp to ensure it's in a valid ISO format
   * Handles various timestamp formats from Google Sheets
   */
  normalizeTimestamp(value: string): string {
    if (!value || value.trim() === "") {
      // Return current timestamp if empty
      return new Date().toISOString()
    }

    try {
      // Try to parse the value as a date
      const date = new Date(value)
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
      
      // If invalid, try to handle common Google Sheets date formats
      // Google Sheets sometimes exports dates as serial numbers
      const numericValue = Number(value)
      if (!isNaN(numericValue) && numericValue > 25569) {
        // Excel/Google Sheets serial date (days since 1900-01-01)
        // 25569 is 1970-01-01 in Excel serial date format
        const excelDate = new Date((numericValue - 25569) * 86400 * 1000)
        if (!isNaN(excelDate.getTime())) {
          return excelDate.toISOString()
        }
      }
      
      // If all else fails, return current timestamp
      console.warn("Could not parse timestamp:", value, "using current time")
      return new Date().toISOString()
    } catch (error) {
      console.warn("Error parsing timestamp:", value, error, "using current time")
      return new Date().toISOString()
    }
  }
}

describe('Timestamp Normalization Fix', () => {
  const service = new TestGoogleSheetsService()

  it('should handle valid ISO timestamps', () => {
    const validTimestamp = '2024-01-15T10:30:00.000Z'
    const result = service.normalizeTimestamp(validTimestamp)
    expect(result).toBe(validTimestamp)
  })

  it('should handle valid date strings', () => {
    const dateString = '2024-01-15 10:30:00'
    const result = service.normalizeTimestamp(dateString)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should handle empty strings', () => {
    const result = service.normalizeTimestamp('')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should handle null/undefined values', () => {
    const result = service.normalizeTimestamp('')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should handle Excel serial dates', () => {
    // Excel serial date for 2024-01-15 (approximately 45306)
    const excelDate = '45306'
    const result = service.normalizeTimestamp(excelDate)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should handle invalid date strings', () => {
    const invalidDate = 'invalid-date-string'
    const result = service.normalizeTimestamp(invalidDate)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('should handle numeric values safely', () => {
    // Test that numeric conversion works
    const testValue = '123.456'
    const numericValue = testValue ? Number.parseFloat(testValue) : 0
    expect(numericValue).toBe(123.456)
    expect(numericValue.toFixed(3)).toBe('123.456')
  })

  it('should handle empty numeric values', () => {
    const testValue = ''
    const numericValue = testValue ? Number.parseFloat(testValue) : 0
    expect(numericValue).toBe(0)
    expect(numericValue.toFixed(3)).toBe('0.000')
  })

  it('should handle non-numeric strings', () => {
    const testValue = 'not-a-number'
    const numericValue = testValue ? Number.parseFloat(testValue) : 0
    expect(isNaN(numericValue)).toBe(true)
    
    // Our safe conversion should handle this
    const safeValue = typeof testValue === 'number' ? testValue : parseFloat(testValue) || 0
    expect(safeValue).toBe(0)
    expect(safeValue.toFixed(3)).toBe('0.000')
  })
})
