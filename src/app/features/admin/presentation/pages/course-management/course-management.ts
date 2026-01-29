import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../infrastructure/services/admin.service';

@Component({
  selector: 'app-course-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './course-management.html',
  styleUrl: './course-management.css',
})
export class CourseManagement implements OnInit {
  allCourses: any[] = [];
  filteredCourses: any[] = [];
  paginatedCourses: any[] = [];

  // Filters
  searchTerm = '';
  selectedStatus = 'Estado: Todos';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;

  // Modals
  isModalOpen = false;
  isDeleteModalOpen = false;
  activeTab = 'general'; // 'general' | 'modules' | 'evaluations'

  // Form/Action Data
  currentCourse: any = { 
    name: '', 
    code: '', 
    teacherName: '', 
    capacity: 150, 
    status: 'DRAFT',
    description: '',
    ciclo: '',
    creditos: 0,
    modules: [],
    evaluaciones: [],
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop' 
  };
  courseToDelete: any = null;
  newModuleTitle = '';
  
  // New Evaluation Form Data
  newEval: any = { nombre: '', tipo: 'Examen', peso: 0, fechaLimite: '' };

  isEditing = false;
  isLoading = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.startLoading();
  }

  startLoading() {
      this.isLoading = true;
      this.adminService.getCourses().subscribe(courses => {
          this.allCourses = courses;
          this.applyFilters();
          this.isLoading = false;
      });
  }

  applyFilters() {
      let temp = [...this.allCourses];

      if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          temp = temp.filter(c => 
              (c.name && c.name.toLowerCase().includes(term)) || 
              (c.code && c.code.toLowerCase().includes(term)) ||
              (c.teacherName && c.teacherName.toLowerCase().includes(term))
          );
      }

      if (this.selectedStatus !== 'Estado: Todos') {
           const statusMap: Record<string, string> = { 'Publicado': 'PUBLISHED', 'Borrador': 'DRAFT', 'Archivado': 'ARCHIVED' };
           const mappedStatus = statusMap[this.selectedStatus] || this.selectedStatus;
           temp = temp.filter(c => c.status === mappedStatus);
      }

      this.filteredCourses = temp;
      this.totalItems = this.filteredCourses.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      if (this.totalPages === 0) this.totalPages = 1;
      this.goToPage(1);
  }

  goToPage(page: number) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      const startIndex = (page - 1) * this.itemsPerPage;
      this.paginatedCourses = this.filteredCourses.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Actions
  openCreateModal() {
      this.isEditing = false;
      this.activeTab = 'general';
      this.currentCourse = { 
          name: '', code: '', teacherName: '', capacity: 150, status: 'DRAFT', 
          description: '', ciclo: '2024-1', creditos: 3,
          modules: [], evaluaciones: [],
          coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'
      };
      this.isModalOpen = true;
  }

  openEditModal(course: any) {
      this.isEditing = true;
      this.activeTab = 'general';
      // Deep copy to prevent mutating list directly while editing
      this.currentCourse = JSON.parse(JSON.stringify(course));
      if(!this.currentCourse.modules) this.currentCourse.modules = [];
      if(!this.currentCourse.evaluaciones) this.currentCourse.evaluaciones = [];
      this.isModalOpen = true;
  }

  closeModal() {
      this.isModalOpen = false;
      this.newModuleTitle = '';
      this.resetEvalForm();
  }

  resetEvalForm() {
      this.newEval = { nombre: '', tipo: 'Examen', peso: 0, fechaLimite: '' };
  }

  saveCourse() {
      if (this.isEditing) {
          this.adminService.updateCourse(this.currentCourse).subscribe(() => {
              const index = this.allCourses.findIndex(c => c.id === this.currentCourse.id);
              if (index !== -1) {
                  this.allCourses[index] = this.currentCourse;
                  this.applyFilters();
              }
              this.closeModal();
          });
      } else {
          this.currentCourse.id = `CRS-${Math.floor(Math.random() * 1000)}`;
          this.currentCourse.enrolled = 0;
          this.adminService.createCourse(this.currentCourse).subscribe(() => {
              this.allCourses.unshift(this.currentCourse);
              this.applyFilters();
              this.closeModal();
          });
      }
  }
  
  // Module Management
  addModule() {
      if(!this.newModuleTitle.trim()) return;
      const newMod = { id: `MOD-${Date.now()}`, title: this.newModuleTitle };
      this.currentCourse.modules.push(newMod);
      this.newModuleTitle = '';
  }

  removeModule(index: number) {
      this.currentCourse.modules.splice(index, 1);
  }

  // Evaluation Management
  addEvaluation() {
      if (!this.newEval.nombre || !this.newEval.peso) return;
      const newEv = { 
          id: `EV-${Date.now()}`, 
          ...this.newEval, 
          estado: 'Pendiente' // Default status
      };
      this.currentCourse.evaluaciones.push(newEv);
      this.resetEvalForm();
  }

  removeEvaluation(index: number) {
      this.currentCourse.evaluaciones.splice(index, 1);
  }

  openDeleteModal(course: any) {
      this.courseToDelete = course;
      this.isDeleteModalOpen = true;
  }

  confirmDelete() {
      if (this.courseToDelete) {
          this.adminService.deleteCourse(this.courseToDelete.id).subscribe(() => {
              this.allCourses = this.allCourses.filter(c => c.id !== this.courseToDelete.id);
              this.applyFilters();
              this.isDeleteModalOpen = false;
              this.courseToDelete = null;
          });
      }
  }

  getPagesArray(): number[] {
      return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  getStatusClass(status: string): string {
      switch (status) {
          case 'PUBLISHED': return 'bg-green-100 text-green-700 border-green-200';
          case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
          case 'ARCHIVED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  }

  getStatusLabel(status: string): string {
      switch(status) {
          case 'PUBLISHED': return 'Publicado';
          case 'DRAFT': return 'Borrador';
          case 'ARCHIVED': return 'Archivado';
          default: return status;
      }
  }
}
