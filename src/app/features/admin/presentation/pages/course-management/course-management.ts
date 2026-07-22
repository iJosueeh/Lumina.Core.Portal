import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminCourseService } from '../../../infrastructure/services/admin-course.service';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

// Sub-components
import { CourseTableComponent } from './components/course-table/course-table.component';
import { PaginationComponent } from '@shared/components/ui/pagination/pagination.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { CourseFormModalComponent } from '@shared/components/modals/course-form-modal/course-form-modal.component';
import { ConfirmDeleteModalComponent } from '@shared/components/ui/confirm-delete-modal/confirm-delete-modal.component';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, 
    CourseTableComponent, 
    PaginationComponent,
    SkeletonLoaderComponent,
    SelectComponent,
    CourseFormModalComponent,
    ConfirmDeleteModalComponent
  ],
  templateUrl: './course-management.html',
  styleUrl: './course-management.css',
})
export class CourseManagement implements OnInit {
  private adminService = inject(AdminCourseService);
  private router = inject(Router);

  allCourses = signal<AdminCourse[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedStatus = signal('Estado: Todos');
  currentPage = signal(1);
  itemsPerPage = 5;
  docentesList = signal<AdminDocente[]>([]);

  // Edit modal state
  showCourseFormModal = signal(false);
  courseToEdit = signal<AdminCourse | null>(null);

  // Delete modal state
  showDeleteModal = signal(false);
  courseToDelete = signal<AdminCourse | null>(null);

  deleteMessage = computed(() => {
    const name = this.courseToDelete()?.name || '';
    return name
      ? `¿Estás seguro de eliminar el curso "${name}"? Esta acción es irreversible.`
      : '¿Estás seguro de eliminar este curso? Esta acción es irreversible.';
  });

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
  
  openCreate(): void { 
    this.router.navigate(['/admin/course/create']);
  }
  
  openEditModal(course: AdminCourse): void { 
    this.courseToEdit.set(course);
    this.showCourseFormModal.set(true);
  }

  deleteCourse(course: AdminCourse): void {
    this.courseToDelete.set(course);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const course = this.courseToDelete();
    if (!course) return;

    this.adminService.deleteCourse(course.id!).subscribe({
      next: () => {
        this.allCourses.update(courses => courses.filter(c => c.id !== course.id));
        this.showDeleteModal.set(false);
        this.courseToDelete.set(null);
      },
      error: () => {
        this.showDeleteModal.set(false);
        this.courseToDelete.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.courseToDelete.set(null);
  }
}
