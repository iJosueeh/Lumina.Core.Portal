import { Injectable } from '@angular/core';
import { RoleUtils } from '../../../../shared/utils/role.utils';

/**
 * Mapper for administrative user data.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminUserMapper {
  
  /**
   * Maps raw API user data to the application domain model.
   */
  mapUser(u: any) {
    const rolNombre = u.rolNombre || u.RolNombre || '';
    const role = RoleUtils.mapToSystemRole(rolNombre);
    const status = RoleUtils.mapToSystemStatus(u.estado ?? u.Estado ?? 'Activo');
    
    return {
      id: u.id ?? u.Id,
      fullName: `${u.nombresPersona ?? u.NombresPersona ?? ''} ${u.apellidoPaterno ?? u.ApellidoPaterno ?? ''} ${u.apellidoMaterno ?? u.ApellidoMaterno ?? ''}`.trim(),
      email: u.email ?? u.Email,
      role: role,
      status: status,
      department: u.departamento ?? u.Departamento ?? '',
      nombresPersona: u.nombresPersona ?? u.NombresPersona ?? '',
      apellidoPaterno: u.apellidoPaterno ?? u.ApellidoPaterno ?? '',
      apellidoMaterno: u.apellidoMaterno ?? u.ApellidoMaterno ?? ''
    };
  }
}
