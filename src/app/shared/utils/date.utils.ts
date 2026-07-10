/**
 * Utility for handling dates and calendar logic.
 */
export class DateUtils {
  /**
   * Checks if two dates are the same (day, month, year).
   */
  static isSameDate(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  /**
   * Gets the date for a specific day of the week within the current week (Mon-Sat).
   * @param targetDayOfWeek 0=Monday, ..., 5=Saturday
   */
  static getDateInCurrentWeek(targetDayOfWeek: number): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Convert our index (0=Monday) to JS index (1=Monday, 0=Sunday)
    const jsTargetDay = targetDayOfWeek === 6 ? 0 : targetDayOfWeek + 1;
    
    const diff = jsTargetDay - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
  }

  /**
   * Formats a date to a string like "Month Year".
   */
  static formatMonthYear(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    return date
      .toLocaleDateString('es-ES', options)
      .replace(/^\w/, (c) => c.toUpperCase());
  }
}
