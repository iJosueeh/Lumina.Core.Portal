import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface TeacherCourseDetail {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  creditos: number;
  ciclo: string;
  totalAlumnos: number;
  alumnosActivos: number;
  alumnosInactivos: number;
  promedioGeneral: number;
  asistenciaPromedio: number;
  estadoCurso: 'Activo' | 'Finalizado' | 'Programado';
  coverImage: string;
  horario: any[];
  stats: {
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    tareasEntregadas: number;
    tareasPendientes: number;
    promedioMasAlto: number;
    promedioMasBajo: number;
  };
  evaluaciones: Evaluacion[];
}

interface Evaluacion {
  id: string;
  nombre: string;
  tipo: string;
  peso: number;
  fechaLimite: string;
  estado: string;
  calificadas: number;
  pendientes: number;
  promedio: number;
}

interface CourseStudent {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  email: string;
  avatar: string;
  promedio: number;
  asistencia: number;
  tareasEntregadas: number;
  tareasPendientes: number;
  estado: string;
  ultimoAcceso: string;
}

type TabType = 'overview' | 'estudiantes' | 'evaluaciones' | 'materiales';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-management.component.html',
  styles: ``,
})
export class CourseManagementComponent implements OnInit {
  courseId = signal<string>('');
  course = signal<TeacherCourseDetail | null>(null);
  students = signal<CourseStudent[]>([]);
  isLoading = signal(true);
  activeTab = signal<TabType>('overview');

  // Computed values
  totalStudents = computed(() => this.course()?.totalAlumnos || 0);
  averageGrade = computed(() => this.course()?.promedioGeneral || 0);
  pendingEvaluations = computed(
    () => this.course()?.evaluaciones.filter((e) => e.estado === 'En Calificación').length || 0,
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.courseId.set(params['id']);
      this.loadCourseData();
    });
  }

  loadCourseData(): void {
    this.isLoading.set(true);

    // Cargar detalles del curso
    this.http
      .get<TeacherCourseDetail[]>('/assets/mock-data/teachers/teacher-courses-detail.json')
      .subscribe({
        next: (courses) => {
          const course = courses.find((c) => c.id === this.courseId());
          if (course) {
            this.course.set(course);
            console.log('✅ [COURSE-MANAGEMENT] Course loaded:', course.titulo);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ [COURSE-MANAGEMENT] Error loading course:', error);
          this.isLoading.set(false);
        },
      });

    // Cargar estudiantes del curso
    this.http.get<any[]>('/assets/mock-data/teachers/course-students.json').subscribe({
      next: (data) => {
        const courseData = data.find((c) => c.courseId === this.courseId());
        if (courseData) {
          this.students.set(courseData.students);
          console.log('✅ [COURSE-MANAGEMENT] Students loaded:', courseData.students.length);
        }
      },
      error: (error) => {
        console.error('❌ [COURSE-MANAGEMENT] Error loading students:', error);
      },
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      'En Calificación': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getStudentStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Inactivo: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  viewEvaluation(evaluationId: string): void {
    console.log('Ver evaluación:', evaluationId);
    // TODO: Implementar navegación a detalles de evaluación
  }

  viewStudentDetails(studentId: string): void {
    console.log('Ver detalles del estudiante:', studentId);
    // TODO: Implementar navegación a detalles del estudiante
  }

  goBack(): void {
    this.router.navigate(['/teacher/dashboard']);
  }
}

