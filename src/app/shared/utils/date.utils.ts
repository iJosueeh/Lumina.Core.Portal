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
   * Gets the date for a specific day of the week within the current week (0=Monday ... 6=Sunday).
   * @param targetDayOfWeek 0=Monday, 1=Tuesday, ..., 6=Sunday
   */
  static getDateInCurrentWeek(targetDayOfWeek: number): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + targetDayOfWeek);
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
