export interface TeacherDashboardStats {
  teacherId: string;
  teacherName: string;
  stats: DashboardGeneralStats;
  performanceIndex: PerformanceIndexData[];
  recentActivities: RecentActivity[];
  upcomingClasses: UpcomingClass[];
}

export interface DashboardGeneralStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  activeStudents: number;
  pendingGrades: number;
  upcomingClasses: number;
  averageAttendance: number;
  averageGrade: number;
}

export interface PerformanceIndexData {
  week: string;
  average: number;
}

export interface RecentActivity {
  id: string;
  type: 'grade' | 'assignment' | 'announcement' | 'attendance';
  title: string;
  description: string;
  course: string;
  timestamp: string;
  icon: string;
}

export interface UpcomingClass {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  date: string;
  endTime: string;
  room: string;
  modality: 'Presencial' | 'Virtual' | 'Híbrido';
  topic: string;
  meetingLink?: string;
}
