import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCourseService } from '../../../infrastructure/services/admin-course.service';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';

// Sub-components
import { CourseTableComponent } from './components/course-table/course-table.component';
import { CourseFormModalComponent } from './components/course-form-modal/course-form-modal.component';
import { PaginationComponent } from '@shared/components/ui/pagination/pagination.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CourseTableComponent, 
    CourseFormModalComponent, 
    PaginationComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent
  ],
  templateUrl: './course-management.html',
  styleUrl: './course-management.css',
})
export class CourseManagement implements OnInit {
  private adminService = inject(AdminCourseService);

  // State Signals
  allCourses = signal<AdminCourse[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedStatus = signal('Estado: Todos');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  // Modals State
  isModalOpen = signal(false);
  isEditing = signal(false);
  currentCourse: AdminCourse = this.getEmptyCourse();
  docentes = signal<AdminDocente[]>([]);

  // Computed
  filteredCourses = computed(() => {
    let temp = [...this.allCourses()];
    const term = this.searchTerm().toLowerCase();
    
    if (term) {
      temp = temp.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.code.toLowerCase().includes(term) ||
        c.teacherName?.toLowerCase().includes(term)
      );
    }

    const status = this.selectedStatus();
    if (status !== 'Estado: Todos') {
      const statusMap: Record<string, string> = { 'Publicado': 'PUBLISHED', 'Borrador': 'DRAFT', 'Archivado': 'ARCHIVED' };
      temp = temp.filter(c => c.status === (statusMap[status] || status));
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
        this.allCourses.set(courses);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadDocentes(): void {
    this.adminService.getDocentes().subscribe({
      next: (data) => this.docentes.set(data),
      error: (err) => console.error('❌ Error loading docentes:', err)
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.currentCourse = this.getEmptyCourse();
    this.isModalOpen.set(true);
  }

  openEditModal(course: AdminCourse): void {
    this.isEditing.set(true);
    this.currentCourse = JSON.parse(JSON.stringify(course));
    this.isModalOpen.set(true);
  }

  saveCourse(course: AdminCourse): void {
    // Lógica de persistencia...
    this.isModalOpen.set(false);
  }

  deleteCourse(course: AdminCourse): void {
    if (confirm(`¿Estás seguro de eliminar el curso ${course.name}?`)) {
      // Lógica de eliminación...
    }
  }

  private getEmptyCourse(): AdminCourse {
    return {
      name: '', code: '', instructorId: null, capacity: 150, status: 'DRAFT',
      description: '', ciclo: '2024-1', creditos: 3,
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
      modules: [], evaluaciones: []
    };
  }
}
