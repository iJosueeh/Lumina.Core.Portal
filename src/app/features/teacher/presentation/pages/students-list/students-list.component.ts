import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';

// Repositories & Services
import { useTeacherStudents } from '@features/teacher/infrastructure/queries/teacher-query-hooks';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { EstudianteMetricasService } from '@features/teacher/infrastructure/services/estudiante-metricas.service';
import { NotificationService } from '@shared/services/notification.service';

// Models & Mappers
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';
import { EstudianteMetricasCompletas } from '@features/teacher/domain/models/estudiante-metricas.model';
import { TeacherStudentMapper, CourseStudentUI } from '../../../infrastructure/mappers/teacher-student.mapper';

// Components
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { StudentStatsComponent } from './components/student-stats/student-stats.component';
import { StudentFilterComponent } from './components/student-filter/student-filter.component';
import { StudentCardComponent } from './components/student-card/student-card.component';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageHeaderComponent,
    SkeletonLoaderComponent,
    StudentStatsComponent,
    StudentFilterComponent,
    StudentCardComponent
  ],
  templateUrl: './students-list.component.html',
})
export class StudentsListComponent {
  private router = inject(Router);
  private authRepository = inject(AuthRepository);
  private courseRepository = inject(TeacherCourseRepository);
  private metricasService = inject(EstudianteMetricasService);
  private mapper = inject(TeacherStudentMapper);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  
  private currentUserId = computed(() => this.authRepository.getCurrentUser()?.id ?? '');
  
  // Queries
  studentsQuery = useTeacherStudents(this.currentUserId());
  
  // State
  searchTerm = signal('');
  selectedCourse = signal<string>('all');
  selectedStatus = signal<string>('all');
  private courseNamesCache = signal<Map<string, string>>(new Map());
  private metricasCache = signal<Map<string, EstudianteMetricasCompletas>>(new Map());
  private ultimosAccesosCache = signal<Map<string, string | null>>(new Map());

  // New Student Modal
  showNewStudentModal = signal(false);
  newStudentSearchTerm = signal('');
  newStudentSelectedUserId = signal('');
  assignableUsers = signal<any[]>([]);
  loadingAssignableUsers = signal(false);
  isCreatingStudent = signal(false);

  // Data processing
  allStudents = computed(() => {
    const students = this.studentsQuery.data() || [];
    return students.map((s: TeacherStudent) => 
      this.mapper.toUIModel(
        s, 
        this.metricasCache().get(s.id),
        this.ultimosAccesosCache().get(s.usuarioId),
        this.courseNamesCache().get(s.cursos[0] || '')
      )
    );
  });

  filteredStudents = computed(() => {
    let students = this.allStudents();
    const term = this.searchTerm().toLowerCase();

    return students.filter(s => {
      const matchCourse = this.selectedCourse() === 'all' || s.courseId === this.selectedCourse();
      const matchStatus = this.selectedStatus() === 'all' || s.estado === this.selectedStatus();
      const matchSearch = !term || 
        s.nombre.toLowerCase().includes(term) ||
        s.apellidos.toLowerCase().includes(term) ||
        s.codigo.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term);

      return matchCourse && matchStatus && matchSearch;
    });
  });

  // Stats
  totalStudents = computed(() => this.allStudents().length);
  activeStudents = computed(() => this.allStudents().filter(s => s.estado === 'Activo').length);
  atRiskStudents = computed(() => this.allStudents().filter(s => s.estado === 'En Riesgo').length);

  courseOptions = computed(() => {
    const uniqueCourses = new Map<string, string>();
    this.allStudents().forEach(s => {
      if (s.courseId && s.courseName && s.courseName !== 'Cargando...') {
        uniqueCourses.set(s.courseId, s.courseName);
      }
    });

    const options = Array.from(uniqueCourses.entries()).map(([id, name]) => ({ label: name, value: id }));
    return options; // StudentFilter adds 'all'
  });

  constructor() {
    effect(() => {
      const students = this.allStudents();
      if (students.length > 0) {
        this.loadMissingData(students);
      }
    });
  }

  private async loadMissingData(students: CourseStudentUI[]) {
    await Promise.all([
      this.loadCourseNames(students),
      this.loadStudentMetrics(students),
      this.loadUltimosAccesos(students)
    ]);
  }

  private async loadStudentMetrics(students: CourseStudentUI[]) {
    const idsToLoad = students.map(s => s.id).filter(id => !this.metricasCache().has(id));
    if (idsToLoad.length === 0) return;

    try {
      const metricasMap = await firstValueFrom(this.metricasService.getMetricasMultiplesEstudiantes(idsToLoad));
      this.metricasCache.update(cache => new Map([...cache, ...metricasMap]));
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  private async loadUltimosAccesos(students: CourseStudentUI[]) {
    const backendStudents = this.studentsQuery.data() || [];
    const idsToLoad = backendStudents.map(s => s.usuarioId).filter(id => !this.ultimosAccesosCache().has(id));
    if (idsToLoad.length === 0) return;

    try {
      const accesosMap = await firstValueFrom(this.metricasService.getUltimosAccesos(idsToLoad));
      this.ultimosAccesosCache.update(cache => new Map([...cache, ...accesosMap]));
    } catch (error) {
      console.error('Error loading last access:', error);
    }
  }

  private async loadCourseNames(students: CourseStudentUI[]) {
    const courseIds = [...new Set(students.map(s => s.courseId).filter(id => id && !this.courseNamesCache().has(id)))] as string[];
    if (courseIds.length === 0) return;

    try {
      const coursePromises = courseIds.map(id =>
        firstValueFrom(this.courseRepository.getCourseById(id))
          .then(c => [id, c.titulo] as [string, string])
          .catch(() => [id, 'Curso sin nombre'] as [string, string])
      );

      const results = await Promise.all(coursePromises);
      this.courseNamesCache.update(cache => new Map([...cache, ...results]));
    } catch (error) {
      console.error('Error loading course names:', error);
    }
  }

  viewStudentDetails(studentId: string): void {
    this.router.navigate(['/teacher/student', studentId]);
  }

  // New Student Modal
  filteredAssignableUsers = computed(() => {
    const term = this.newStudentSearchTerm().toLowerCase();
    return this.assignableUsers().filter((u: any) => {
      if (!term) return true;
      const content = `${u.nombreCompleto} ${u.email}`.toLowerCase();
      return content.includes(term);
    });
  });

  openNewStudentModal(): void {
    this.showNewStudentModal.set(true);
    this.loadAssignableUsers();
  }

  private async loadAssignableUsers(): Promise<void> {
    this.loadingAssignableUsers.set(true);
    try {
      const response = await firstValueFrom(this.http.get<any>(`${environment.usuariosApiUrl}/usuarios`));
      const rawUsers = Array.isArray(response) ? response : Array.isArray(response?.value) ? response.value : [];
      const enrolledIds = new Set(this.allStudents().map(s => s.id?.toLowerCase()));

      const users = rawUsers
        .map((u: any) => ({
          id: u?.id ?? u?.Id,
          nombreCompleto: [u?.nombresPersona, u?.apellidoPaterno, u?.apellidoMaterno].filter(Boolean).join(' ').trim(),
          email: String(u?.email ?? u?.Email ?? '').trim(),
          rolNombre: String(u?.rolNombre ?? u?.RolNombre ?? '').trim(),
        }))
        .filter((u: any) => {
          if (!u.id || !u.email) return false;
          if (u.rolNombre.toLowerCase() !== 'student') return false;
          if (enrolledIds.has(String(u.id).toLowerCase())) return false;
          return true;
        })
        .reduce((acc: any[], u: any) => {
          if (!acc.some(x => x.email.toLowerCase() === u.email.toLowerCase())) acc.push(u);
          return acc;
        }, []);

      this.assignableUsers.set(users);
      if (users.length > 0) this.newStudentSelectedUserId.set(users[0].id);
    } catch (err: any) {
      console.error('Error loading assignable users:', err);
      this.assignableUsers.set([]);
    } finally {
      this.loadingAssignableUsers.set(false);
    }
  }

  async createStudent(): Promise<void> {
    const userId = this.newStudentSelectedUserId();
    if (!userId) return;

    this.isCreatingStudent.set(true);
    try {
      await firstValueFrom(this.http.post(`${environment.estudiantesApiUrl}/estudiantes`, { usuarioId: userId }));
      this.notification.show('success', 'Estudiante creado correctamente.');
      this.showNewStudentModal.set(false);
      this.studentsQuery.refetch();
    } catch (err: any) {
      this.notification.show('error', err?.error?.name || 'Error al crear estudiante.');
    } finally {
      this.isCreatingStudent.set(false);
    }
  }

  exportToCSV(): void {
    const students = this.filteredStudents();
    if (students.length === 0) return;

    const headers = ['Nombre', 'Apellidos', 'Código', 'Email', 'Curso', 'Promedio', 'Asistencia %', 'Estado'];
    const rows = students.map(s => [
      `"${s.nombre}"`, `"${s.apellidos}"`, s.codigo, s.email,
      `"${s.courseName ?? ''}"`, s.promedio.toFixed(2),
      s.asistencia.toFixed(1) + '%', s.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estudiantes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
