import { Injectable } from '@angular/core';
import { RoleUtils } from '../../../../shared/utils/role.utils';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardMapper {
  
  computeStats(usuarios: any[], cursos: any[]) {
    const counts = { student: 0, teacher: 0, admin: 0 };
    
    usuarios.forEach(u => {
      const role = RoleUtils.mapToSystemRole(u.rolNombre || u.RolNombre);
      if (role === 'STUDENT') counts.student++;
      else if (role === 'TEACHER') counts.teacher++;
      else if (role === 'ADMIN') counts.admin++;
    });

    return {
      stats: [
        { label: 'Estudiantes', icon: 'users', value: counts.student.toString() },
        { label: 'Docentes', icon: 'chalkboard-teacher', value: counts.teacher.toString() },
        { label: 'Cursos', icon: 'book', value: cursos.length.toString() },
        { label: 'Usuarios Totales', icon: 'university', value: usuarios.length.toString() }
      ],
      systemStatus: [{ title: 'Servicios operativos', type: 'info', message: 'Todos los módulos responden correctamente.' }]
    };
  }

  getFallbackStats() {
    return { 
      stats: [], 
      systemStatus: [{ title: 'Error de conexión', type: 'error', message: 'No se pudo conectar con los servicios centrales.' }] 
    };
  }
}
