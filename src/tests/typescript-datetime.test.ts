/**
 * Test TypeScript DateTime types integration
 * This file validates that our DateTime types work correctly with existing time utilities
 */

import { 
  strictDateTimeExample, 
  calculateDuration, 
  formatDateTimeSafely 
} from '../utils/strict-time-example';
import type { DateTime } from '../types/date';

describe('TypeScript DateTime Types Integration', () => {
  test('strictDateTimeExample creates proper DateTime object', () => {
    const result = strictDateTimeExample('2025-01-15', '14:30');
    
    expect(result).toHaveProperty('utc');
    expect(result).toHaveProperty('local');
    expect(result).toHaveProperty('timezone');
    expect(result.utc).toBeInstanceOf(Date);
    expect(result.local).toBeInstanceOf(Date);
    expect(result.timezone).toBe('Europe/Berlin');
  });
  
  test('calculateDuration works with DateTime objects', () => {
    const start = strictDateTimeExample('2025-01-15', '08:00');
    const end = strictDateTimeExample('2025-01-15', '16:00');
    
    const duration = calculateDuration(start, end);
    expect(duration).toBe(480); // 8 hours in minutes
  });
  
  test('formatDateTimeSafely handles null values', () => {
    expect(formatDateTimeSafely(null)).toBe('');
    expect(formatDateTimeSafely(undefined)).toBe('');
  });
  
  test('formatDateTimeSafely formats DateTime correctly', () => {
    const dt = strictDateTimeExample('2025-01-15', '14:30');
    const formatted = formatDateTimeSafely(dt);
    
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
  
  test('types enforce correct input formats', () => {
    // These would cause TypeScript errors if types are wrong:
    const validDate = '2025-01-15'; // DateString
    const validTime = '14:30';      // TimeString
    const validTimezone = 'Europe/Berlin'; // Timezone
    
    const dt = strictDateTimeExample(validDate, validTime, validTimezone);
    expect(dt).toBeDefined();
  });
});