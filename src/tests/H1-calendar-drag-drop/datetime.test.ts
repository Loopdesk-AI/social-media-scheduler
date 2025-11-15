import {
    formatDateTimeLabel,
    formatDayHeader,
    getDateString,
    getHourFromISO,
    getSlotDateTime,
    getWeekDates,
    isPastDate,
} from '../../utils/datetime';

describe('H1: Calendar Drag & Drop - DateTime Utilities', () => {
  describe('getSlotDateTime', () => {
    it('should generate correct ISO datetime', () => {
      const result = getSlotDateTime('2025-11-17', 10);
      expect(result).toBe('2025-11-17T10:00:00.000Z');
    });

    it('should handle midnight hour', () => {
      const result = getSlotDateTime('2025-11-17', 0);
      expect(result).toBe('2025-11-17T00:00:00.000Z');
    });

    it('should handle single digit hours correctly', () => {
      const result = getSlotDateTime('2025-11-17', 9);
      expect(result).toBe('2025-11-17T09:00:00.000Z');
    });
  });

  describe('formatDateTimeLabel', () => {
    it('should format datetime correctly', () => {
      const result = formatDateTimeLabel('2025-11-17T14:00:00.000Z');
      expect(result).toMatch(/Nov 17, 2025 at \d+:\d{2} (AM|PM)/);
    });
  });

  describe('getDateString', () => {
    it('should extract date from ISO string', () => {
      const result = getDateString('2025-11-17T14:30:00.000Z');
      expect(result).toBe('2025-11-17');
    });
  });

  describe('getHourFromISO', () => {
    it('should extract hour from ISO string', () => {
      const result = getHourFromISO('2025-11-17T14:30:00.000Z');
      expect(result).toBe(14);
    });

    it('should handle midnight', () => {
      const result = getHourFromISO('2025-11-17T00:30:00.000Z');
      expect(result).toBe(0);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const pastDate = '2020-01-01T10:00:00.000Z';
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = '2030-01-01T10:00:00.000Z';
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe('getWeekDates', () => {
    it('should return 7 dates', () => {
      const dates = getWeekDates(new Date('2025-11-17'));
      expect(dates).toHaveLength(7);
    });

    it('should return dates in YYYY-MM-DD format', () => {
      const dates = getWeekDates(new Date('2025-11-17'));
      dates.forEach((date: string) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should start from Sunday', () => {
      const startDate = new Date('2025-11-16'); // Sunday
      const dates = getWeekDates(startDate);
      expect(dates[0]).toBe('2025-11-16');
    });
  });

  describe('formatDayHeader', () => {
    it('should format day header correctly', () => {
      const result = formatDayHeader('2025-11-17');
      expect(result).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/);
    });
  });
});
