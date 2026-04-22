import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Repositories & Services
import { useTeacherStudents } from '@features/teacher/infrastructure/queries/teacher-query-hooks';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherCourseRepository } from '@features/teacher/domain/repositories/teacher-course.repository';
import { EstudianteMetricasService } from '@features/teacher/infrastructure/services/estudiante-metricas.service';

// Models & Mappers
import { TeacherStudent } from '@features/teacher/domain/models/teacher-student.model';
import { EstudianteMetricasCompletas } from '@features/teacher/domain/models/estudiante-metricas.model';
import { TeacherStudentMapper, CourseStudentUI } from '../../../infrastructure/mappers/teacher-student.mapper';

// Components
import { SkeletonLoaderComponent } from '../../../../../shared/components/ui/skeleton-loader/skeleton-loader.component';
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
