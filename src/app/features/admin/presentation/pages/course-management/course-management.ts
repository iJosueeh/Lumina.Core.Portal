import { Component, OnInit, signal, computed, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCourseService } from '../../../infrastructure/services/admin-course.service';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

// Sub-components
import { CourseTableComponent } from './components/course-table/course-table.component';
import { PaginationComponent } from '@shared/components/ui/pagination/pagination.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { EvaluacionModalComponent } from '@shared/components/modals/evaluacion-modal/evaluacion-modal.component';
import { CourseFormModalComponent } from '@shared/components/modals/course-form-modal/course-form-modal.component';
import { EvaluacionApi } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-management',
  standalone: true,
  encapsulation: ViewEncapsulation.None, // Forzar estilos globales
  imports: [
    CommonModule, 
    FormsModule, 
    CourseTableComponent, 
    PaginationComponent,
    ButtonComponent,
    SelectComponent,
    SkeletonLoaderComponent,
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
  itemsPerPage = 10;
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
        (c.code && c.code.toLowerCase().includes(term))
      );
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
    this.loadDocentes();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.adminService.getCourses().subscribe({
      next: (courses) => {
        console.log('✅ [ADMIN-COURSE-MGMT] Courses Received:', courses.length);
        this.allCourses.set(courses);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadDocentes(): void {
    this.adminService.getDocentes().subscribe({
      next: (docs) => this.docentesList.set(docs),
      error: () => console.error('❌ Error cargando docentes')
    });
  }

  setOption(value: any): void { this.selectedStatus.set(String(value)); }
  setPage(page: any): void { this.currentPage.set(Number(page)); }
  
  openCreateModal(): void { 
    this.courseToEdit.set(null);
    this.showCourseFormModal.set(true); 
  }
  
  openEvaluacionSettings(course: AdminCourse): void {
    this.selectedCourseId.set(course.id || null);
    this.selectedDocenteId.set(course.instructorId); 
    this.editingEvaluacion.set(null); 
    this.showEvaluacionModal.set(true);
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
