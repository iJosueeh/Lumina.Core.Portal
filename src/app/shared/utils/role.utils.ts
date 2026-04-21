/**
 * Standard roles for the system.
 */
export type SystemRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'USER';

/**
 * Utility for handling roles and permissions.
 */
export class RoleUtils {
  /**
   * Maps a backend role string to a standardized system role.
   */
  static mapToSystemRole(roleName: string): SystemRole {
    const normalized = (roleName || '').toLowerCase().trim();
    if (normalized === 'admin') return 'ADMIN';
    if (normalized === 'teacher' || normalized === 'docente') return 'TEACHER';
    if (normalized === 'student' || normalized === 'estudiante') return 'STUDENT';
    return 'USER';
  }

  /**
   * Maps a backend status to a standardized status.
   */
  static mapToSystemStatus(status: string): 'ACTIVE' | 'SUSPENDED' {
    const normalized = (status || '').toLowerCase().trim();
    return normalized === 'activo' || normalized === 'active' ? 'ACTIVE' : 'SUSPENDED';
  }
}
