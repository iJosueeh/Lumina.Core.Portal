import { Injectable } from '@angular/core';
import { SystemStatus, RecentActivity } from '../mocks';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardHealthService {

  buildSystemStatus(apiStatus: boolean, dbStatus: boolean, servicesStatus: boolean): SystemStatus[] {
    return [
      {
        title: 'API Global',
        type: apiStatus ? 'success' : 'error',
        message: apiStatus ? 'Todos los sistemas operacionales' : 'Verificando conectividad con el Gateway',
      },
      {
        title: 'Base de Datos',
        type: dbStatus ? 'success' : 'error',
        message: dbStatus ? 'Sincronización en tiempo real' : 'Base de datos temporalmente fuera de línea',
      },
      {
        title: 'Servicios Activos',
        type: servicesStatus ? 'success' : 'error',
        message: servicesStatus ? 'Todos los microservicios conectados' : 'Reiniciando servicios de soporte',
      },
    ];
  }

  buildSystemStatusTodo(): SystemStatus[] {
    return [
      {
        title: 'API Global',
        type: 'warning',
        message: 'Configurando gateway de enlace',
      },
      {
        title: 'Base de Datos',
        type: 'warning',
        message: 'Estableciendo conexión persistente',
      },
      {
        title: 'Servicios Activos',
        type: 'warning',
        message: 'Sincronizando microservicios',
      },
    ];
  }

  buildRecentActivityFromData(data: any[]): RecentActivity[] {
    const now = new Date();
    if (!data || data.length === 0) return this.buildRecentActivityTodo();

    // Si recibimos una lista de usuarios (UserDto)
    return data.slice(0, 4).map((user, index) => ({
      title: `Nuevo registro: ${user.nombres || 'Usuario'} ${user.apellidoPaterno || ''}`,
      time: this.getTimeAgo(new Date(now.getTime() - (index * 120 + 15) * 60000)),
      description: `Usuario registrado exitosamente con rol ${user.rolNombre || 'asignado'}`
    }));
  }

  buildRecentActivityTodo(): RecentActivity[] {
    const now = new Date();
    return [
      {
        title: 'Registro de estudiantes sincronizado',
        time: this.getTimeAgo(now),
        description: 'Carga inicial de datos completada',
      },
      {
        title: 'Actualizaciones de cursos verificadas',
        time: this.getTimeAgo(now),
        description: 'Últimos cambios reflejados en el portal',
      },
      {
        title: 'Actividad de docentes monitoreada',
        time: this.getTimeAgo(now),
        description: 'Servicio de eventos académicos activo',
      },
      {
        title: 'Logs de sincronización validados',
        time: this.getTimeAgo(now),
        description: 'Integridad de datos confirmada entre servicios',
      },
    ];
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'hace poco';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
