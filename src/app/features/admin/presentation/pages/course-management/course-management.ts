import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminCourseService } from '../../../infrastructure/services/admin-course.service';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

// Sub-components
import { CourseTableComponent } from './components/course-table/course-table.component';
import { PaginationComponent } from '@shared/components/ui/pagination/pagination.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { EvaluacionModalComponent } from '@shared/components/modals/evaluacion-modal/evaluacion-modal.component';
import { CourseFormModalComponent } from '@shared/components/modals/course-form-modal/course-form-modal.component';
import { EvaluacionApi } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, 
    CourseTableComponent, 
    PaginationComponent,
    SkeletonLoaderComponent,
    SelectComponent,
    EvaluacionModalComponent,
    CourseFormModalComponent
  ],
  templateUrl: './course-management.html',
  styleUrl: './course-management.css',
})
export class CourseManagement implements OnInit {
  private adminService = inject(AdminCourseService);

  allCourses = signal<AdminCourse[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedStatus = signal('Estado: Todos');
  currentPage = signal(1);
  itemsPerPage = 5;
  docentesList = signal<AdminDocente[]>([]);

  // Modal State
  showEvaluacionModal = signal(false);
  showCourseFormModal = signal(false);
  selectedCourseId = signal<string | null>(null);
  selectedDocenteId = signal<string | null>(null);
  editingEvaluacion = signal<EvaluacionApi | null>(null);
  courseToEdit = signal<AdminCourse | null>(null);

  filteredCourses = computed(() => {
    let temp = [...this.allCourses()];
    const term = this.searchTerm().toLowerCase();
    if (term) {
      temp = temp.filter(c => 
        c.name.toLowerCase().includes(term) || 
        (c.code && c.code.toLowerCase().includes(term)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(term))
      );
    }
    const status = this.selectedStatus();
    if (status && !status.includes('Todos')) {
      const statusMap: Record<string, string> = {
        'Publicado': 'PUBLISHED',
        'Borrador': 'DRAFT',
        'Archivado': 'ARCHIVED'
      };
      const targetStatus = statusMap[status];
      if (targetStatus) {
        temp = temp.filter(c => c.status === targetStatus);
      }
    }
    return temp;
  });

  paginatedCourses = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredCourses().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => Math.ceil(this.filteredCourses().length / this.itemsPerPage) || 1);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      courses: this.adminService.getCourses(),
      docentes: this.adminService.getDocentes()
    }).subscribe({
      next: ({ courses, docentes }) => {
        this.docentesList.set(docentes);
        
        const resolvedCourses = courses.map((course) => {
            const docente = docentes.find((d) => {
                const courseInstId = typeof course.instructorId === 'object' ? (course.instructorId as any)?.value : course.instructorId;
                const docenteId = typeof d.id === 'object' ? (d.id as any)?.value : d.id;
                return String(docenteId).toLowerCase() === String(courseInstId).toLowerCase();
            });

            return {
                ...course,
                teacherName: docente ? docente.nombreCompleto : 'Sin asignar'
            };
        });

        this.allCourses.set(resolvedCourses);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setOption(value: any): void { this.selectedStatus.set(String(value)); this.currentPage.set(1); }
  setPage(page: any): void { this.currentPage.set(Number(page)); }
  onSearch(value: string): void { this.searchTerm.set(value); this.currentPage.set(1); }
  
  openCreateModal(): void { 
    this.courseToEdit.set(null);
    this.showCourseFormModal.set(true); 
  }
  
  openEditModal(course: AdminCourse): void { 
    this.courseToEdit.set(course);
    this.showCourseFormModal.set(true);
  }

  deleteCourse(course: AdminCourse): void { 
    if (confirm(`¿Estás seguro de eliminar el curso "${course.name}"?`)) {
        console.log('Borrando', course.id); 
    }
  }
}
