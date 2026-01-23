import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  courseId?: string;
  courseName?: string;
}

interface CourseFilter {
  id: string;
  name: string;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './students-list.component.html',
  styles: ``,
})
export class StudentsListComponent implements OnInit {
  allStudents = signal<CourseStudent[]>([]);
  searchTerm = signal('');
  selectedCourse = signal<string>('all');
  selectedStatus = signal<string>('all');
  isLoading = signal(true);

  // Computed values
  courses = computed(() => {
    const students = this.allStudents();
    const uniqueCourses = new Map<string, string>();
    
    students.forEach((student) => {
      if (student.courseId && student.courseName) {
        uniqueCourses.set(student.courseId, student.courseName);
      }
    });

    return Array.from(uniqueCourses.entries()).map(([id, name]) => ({ id, name }));
  });

  filteredStudents = computed(() => {
    let students = this.allStudents();

    // Filtrar por curso
    if (this.selectedCourse() !== 'all') {
      students = students.filter((s) => s.courseId === this.selectedCourse());
    }

    // Filtrar por estado
    if (this.selectedStatus() !== 'all') {
      students = students.filter((s) => s.estado === this.selectedStatus());
    }

    // Filtrar por búsqueda
    const term = this.searchTerm().toLowerCase();
    if (term) {
      students = students.filter(
        (s) =>
          s.nombre.toLowerCase().includes(term) ||
          s.apellidos.toLowerCase().includes(term) ||
          s.codigo.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term),
      );
    }

    return students;
  });

  totalStudents = computed(() => this.allStudents().length);
  activeStudents = computed(() => this.allStudents().filter((s) => s.estado === 'Activo').length);
  atRiskStudents = computed(() => this.allStudents().filter((s) => s.estado === 'En Riesgo').length);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading.set(true);

    this.http.get<any[]>('/assets/mock-data/teachers/course-students.json').subscribe({
      next: (data) => {
        // Aplanar todos los estudiantes de todos los cursos
        const allStudents: CourseStudent[] = [];
        data.forEach((courseData) => {
          courseData.students.forEach((student: any) => {
            allStudents.push({
              ...student,
              courseId: courseData.courseId,
              courseName: courseData.courseName,
            });
          });
        });

        this.allStudents.set(allStudents);
        console.log('✅ [STUDENTS-LIST] Students loaded:', allStudents.length);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ [STUDENTS-LIST] Error loading students:', error);
        this.isLoading.set(false);
      },
    });
  }

  getStatusColor(estado: string): string {
    const colors: Record<string, string> = {
      Activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Inactivo: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
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

  viewStudentDetails(studentId: string): void {
    console.log('Ver detalles del estudiante:', studentId);
    // TODO: Implementar navegación a detalles del estudiante
  }

  exportToCSV(): void {
    console.log('Exportar a CSV');
    // TODO: Implementar exportación
    alert('Funcionalidad de exportación próximamente');
  }
}

