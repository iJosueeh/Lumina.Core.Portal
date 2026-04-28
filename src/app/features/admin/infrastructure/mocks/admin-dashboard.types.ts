/**
 * Tipos para Admin Dashboard
 * Define las estructuras de datos utilizadas en el dashboard del administrador
 */

export interface DashboardStat {
  label: string;
  value: string;
  icon?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  status?: string;
  color?: 'blue' | 'purple' | 'teal' | 'orange' | 'green';
}

export interface SystemStatus {
  title: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface RecentActivity {
  title: string;
  time: string;
  description?: string;
}

export interface ChartDataPoint {
  month: string;
  newRegistrations: number;
  activeCompletion: number;
}

export interface ChartData {
  title: string;
  subtitle: string;
  data: ChartDataPoint[];
  period: 'month' | 'year';
}

export interface AdminDashboardData {
  stats: DashboardStat[];
  systemStatus: SystemStatus[];
  recentActivity: RecentActivity[];
  chartData?: ChartData;
}
