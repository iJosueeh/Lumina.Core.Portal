/**
 * Mock Data - Admin Dashboard
 * Datos simulados para desarrollo y testing
 * Para usar datos reales, inyectar un servicio que llame a la API
 */

import { AdminDashboardData } from './admin-dashboard.types';

/**
 * Datos mock del dashboard del administrador
 * Basados en la referencia visual de The Lucid Scholar
 */
export const ADMIN_DASHBOARD_MOCK_DATA: AdminDashboardData = {
  stats: [
    {
      label: 'STUDENTS',
      value: '12,482',
      icon: 'fa-user-graduate',
      trend: '↑12%',
      trendType: 'positive',
      description: 'Students enrolled'
    },
    {
      label: 'TEACHERS',
      value: '842',
      icon: 'fa-chalkboard-user',
      trend: '↑4%',
      trendType: 'positive',
      description: 'Active faculty'
    },
    {
      label: 'COURSES',
      value: '1,204',
      icon: 'fa-book-open',
      description: 'Courses available',
      status: 'Stable'
    },
    {
      label: 'TOTAL USERS',
      value: '14.2k',
      icon: 'fa-users',
      trend: '↑8.2%',
      trendType: 'positive',
      description: 'Platform users'
    }
  ],
  systemStatus: [
    {
      title: 'Global API',
      type: 'success',
      message: 'STABLE'
    },
    {
      title: 'Query Engine',
      type: 'info',
      message: '99.8%'
    },
    {
      title: 'CDN Nodes',
      type: 'info',
      message: 'OPERATIONAL'
    },
    {
      title: 'Peak Load Performance',
      type: 'info',
      message: 'System currently handling 4,200 concurrent requests with <1ms latency'
    }
  ],
  recentActivity: [
    {
      title: 'Horizon Institute added 4 new scholars',
      time: '2 minutes ago'
    },
    {
      title: 'Quantum Physics course updated to v2.4',
      time: '45 minutes ago'
    },
    {
      title: 'Admin Verification completed for 12 accounts',
      time: '1 hour ago'
    },
    {
      title: 'Login anomaly detected in London Region',
      time: '5 hours ago'
    }
  ]
};
