/**
 * Utility for handling and validating GUIDs.
 */
export class GuidUtils {
  /**
   * Validates if a string is a GUID and extracts it.
   */
  static extractGuid(value: any): string | null {
    const candidate = value?.value ?? value?.Value ?? value?.id ?? value;
    if (!candidate) return null;
    const normalized = String(candidate).trim();
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidPattern.test(normalized) ? normalized : null;
  }
}
