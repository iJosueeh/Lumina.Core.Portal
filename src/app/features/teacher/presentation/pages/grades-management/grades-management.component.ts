import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

interface Evaluacion {
  id: string;
  nombre: string;
  peso: number;
  tipo: string;
}

interface CalificacionEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  estudianteCodigo: string;
  notas: { [key: string]: number | null };
  promedio: number;
  estado: string;
}

interface CourseGradesData {
  courseId: string;
  courseName: string;
  courseCode: string;
  evaluaciones: Evaluacion[];
  calificaciones: CalificacionEstudiante[];
  estadisticas: {
    promedioGeneral: number;
    notaMasAlta: number;
    notaMasBaja: number;
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    totalEstudiantes: number;
  };
}

interface TeacherCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-grades-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grades-management.component.html',
  styles: ``,
})
export class GradesManagementComponent implements OnInit {
  protected readonly Math = Math;

  courses = signal<TeacherCourse[]>([]);
  selectedCourseId = signal<string>('');
  courseGradesData = signal<CourseGradesData | null>(null);
  isLoading = signal(true);
  searchTerm = signal('');
  hasUnsavedChanges = signal(false);

  // Computed values
  evaluaciones = computed(() => this.courseGradesData()?.evaluaciones || []);
  calificaciones = computed(() => this.courseGradesData()?.calificaciones || []);
  estadisticas = computed(() => this.courseGradesData()?.estadisticas || null);

  filteredCalificaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const califs = this.calificaciones();

    if (!term) return califs;

    return califs.filter(
      (c) =>
        c.estudianteNombre.toLowerCase().includes(term) ||
        c.estudianteCodigo.toLowerCase().includes(term),
    );
  });

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.http.get<any[]>('/assets/mock-data/teachers/teacher-courses-detail.json').subscribe({
      next: (courses) => {
        const simplifiedCourses = courses.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          titulo: c.titulo,
        }));
        this.courses.set(simplifiedCourses);

        if (courses.length > 0) {
          this.selectedCourseId.set(courses[0].id);
          this.loadGrades();
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [GRADES] Error loading courses:', error);
        this.isLoading.set(false);
      },
    });
  }

  onCourseChange(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    const courseId = this.selectedCourseId();
    if (!courseId) return;

    this.isLoading.set(true);

    this.http.get<CourseGradesData[]>('/assets/mock-data/teachers/grades-management.json').subscribe({
      next: (data) => {
        const courseData = data.find((c) => c.courseId === courseId);
        if (courseData) {
          this.courseGradesData.set(courseData);
          console.log('✅ [GRADES] Grades loaded for course:', courseData.courseName);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [GRADES] Error loading grades:', error);
        this.isLoading.set(false);
      },
    });
  }

  onGradeChange(estudianteId: string, evaluacionId: string, value: string): void {
    const califs = this.calificaciones();
    const estudiante = califs.find((c) => c.estudianteId === estudianteId);

    if (estudiante) {
      const numValue = value === '' ? null : parseFloat(value);
      estudiante.notas[evaluacionId] = numValue;
      this.hasUnsavedChanges.set(true);
      this.calculateStudentAverage(estudiante);
    }
  }

  calculateStudentAverage(estudiante: CalificacionEstudiante): void {
    const evaluaciones = this.evaluaciones();
    let totalWeighted = 0;
    let totalWeight = 0;

    evaluaciones.forEach((evaluation) => {
      const nota = estudiante.notas[evaluation.id];
      if (nota !== null && nota !== undefined) {
        totalWeighted += nota * (evaluation.peso / 100);
        totalWeight += evaluation.peso / 100;
      }
    });

    estudiante.promedio = totalWeight > 0 ? totalWeighted / totalWeight : 0;

    // Actualizar estado
    if (estudiante.promedio >= 14) {
      estudiante.estado = 'Aprobado';
    } else if (estudiante.promedio >= 10.5) {
      estudiante.estado = 'En Riesgo';
    } else {
      estudiante.estado = 'Reprobado';
    }
  }

  saveChanges(): void {
    if (!this.hasUnsavedChanges()) return;

    console.log('💾 [GRADES] Saving changes...', this.calificaciones());
    // TODO: Implementar guardado en backend

    this.hasUnsavedChanges.set(false);
    alert('✅ Cambios guardados exitosamente');
  }

  exportToCSV(): void {
    console.log('📊 [GRADES] Exporting to CSV...');
    // TODO: Implementar exportación
    alert('Exportación a CSV - Próximamente');
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Aprobado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Reprobado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getGradeColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'text-gray-400';
    if (grade >= 14) return 'text-green-600 dark:text-green-400 font-semibold';
    if (grade >= 10.5) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  getInputBorderColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'border-gray-600';
    if (grade >= 14) return 'border-green-500';
    if (grade >= 10.5) return 'border-orange-500';
    return 'border-red-500';
  }
}

