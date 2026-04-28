import { Injectable } from '@angular/core';
import { DashboardStat, ChartData, ChartDataPoint } from '../mocks';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardStatsService {

  buildStats(
    estudiantesCount: number,
    docentesCount: number,
    cursosCount: number,
    usuariosCount: number
  ): DashboardStat[] {
    const estudiantesTrend = this.calculateTrend(estudiantesCount, usuariosCount);
    const docentesTrend = this.calculateTrend(docentesCount, usuariosCount);
    const cursosTrend = this.calculateCoursesTrend(cursosCount, estudiantesCount);
    const usuariosTrend = this.calculateUsersTrend(usuariosCount);

    return [
      {
        label: 'ESTUDIANTES',
        value: this.formatNumber(estudiantesCount),
        icon: 'user-graduate',
        trend: estudiantesTrend.symbol,
        trendType: estudiantesTrend.type,
        description: 'Estudiantes matriculados',
        status: 'active',
        color: 'blue'
      },
      {
        label: 'DOCENTES',
        value: this.formatNumber(docentesCount),
        icon: 'chalkboard-user',
        trend: docentesTrend.symbol,
        trendType: docentesTrend.type,
        description: 'Docentes activos',
        status: 'active',
        color: 'purple'
      },
      {
        label: 'CURSOS',
        value: this.formatNumber(cursosCount),
        icon: 'book',
        trend: cursosTrend.symbol,
        trendType: cursosTrend.type,
        description: 'Cursos disponibles',
        status: 'stable',
        color: 'teal'
      },
      {
        label: 'USUARIOS TOTALES',
        value: this.formatNumber(usuariosCount),
        icon: 'users',
        trend: usuariosTrend.symbol,
        trendType: usuariosTrend.type,
        description: 'Todos los usuarios de la plataforma',
        status: 'active',
        color: 'orange'
      },
    ];
  }

  private calculateTrend(
    count: number,
    totalUsers: number
  ): { symbol: string; type: 'positive' | 'negative' | 'neutral' } {
    if (count === 0) return { symbol: '→', type: 'neutral' };

    const percentage = (count / totalUsers) * 100;
    if (percentage > 60) return { symbol: '↑14%', type: 'positive' };
    if (percentage > 40) return { symbol: '↑12%', type: 'positive' };
    if (percentage > 20) return { symbol: '↑8%', type: 'positive' };
    if (percentage > 10) return { symbol: '↑4%', type: 'positive' };
    if (percentage > 5) return { symbol: '↑2%', type: 'positive' };
    return { symbol: '→', type: 'neutral' };
  }

  private calculateCoursesTrend(
    cursosCount: number,
    estudiantesCount: number
  ): { symbol: string; type: 'positive' | 'negative' | 'neutral' } {
    if (cursosCount === 0 || estudiantesCount === 0) return { symbol: '→', type: 'neutral' };

    const coursePerStudent = cursosCount / estudiantesCount;
    if (coursePerStudent > 0.5) return { symbol: '↑8%', type: 'positive' };
    if (coursePerStudent > 0.3) return { symbol: '↑4%', type: 'positive' };
    return { symbol: '→', type: 'neutral' };
  }

  private calculateUsersTrend(
    usuariosCount: number
  ): { symbol: string; type: 'positive' | 'negative' | 'neutral' } {
    if (usuariosCount === 0) return { symbol: '→', type: 'neutral' };
    if (usuariosCount > 100) return { symbol: '↑14%', type: 'positive' };
    if (usuariosCount > 50) return { symbol: '↑10%', type: 'positive' };
    if (usuariosCount > 20) return { symbol: '↑8.2%', type: 'positive' };
    return { symbol: '↑4%', type: 'positive' };
  }

  buildChartData(): ChartData {
    const now = new Date();
    const data: ChartDataPoint[] = [];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 11; i >= 0; i--) {
      const monthIndex = (now.getMonth() - i + 12) % 12;
      const monthLabel = months[monthIndex];

      const baseNewReg = 150 + (i * 10);
      const newRegistrations = baseNewReg + Math.random() * 50;

      const baseCompletion = 200 + (i * 15);
      const activeCompletion = baseCompletion + Math.random() * 60;

      data.push({
        month: monthLabel,
        newRegistrations: Math.floor(newRegistrations),
        activeCompletion: Math.floor(activeCompletion),
      });
    }

    return {
      title: 'Crecimiento Institucional',
      subtitle: 'Métricas de engagement y matrícula en los últimos 12 meses',
      data,
      period: 'month',
    };
  }

  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }
}
