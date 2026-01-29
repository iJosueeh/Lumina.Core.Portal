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
      
      const newMod = { 
          id: `MOD-${Date.now()}`, 
          title: this.newModuleTitle,
          description: '',
          duration: '',
          topics: [],
          isExpanded: true // Default to expanded when adding
      };
      
      this.currentCourse.modules.push(newMod);
      this.newModuleTitle = '';
  }

  toggleModuleExpand(module: any) {
      module.isExpanded = !module.isExpanded;
  }

  addTopic(module: any, topicInput: HTMLInputElement) {
      const topicName = topicInput.value.trim();
      if (!topicName) return;
      if (!module.topics) module.topics = [];
      
      // Simple string topics as requested, materials are separate now
      module.topics.push(topicName);
      topicInput.value = '';
  }

  // Material Modal
  isMaterialModalOpen = false;
  newMaterialName = '';
  selectedFile: File | null = null;
  currentModuleForMaterial: any = null;

  openAddMaterialModal(module: any) {
      this.currentModuleForMaterial = module;
      this.newMaterialName = '';
      this.selectedFile = null;
      this.isMaterialModalOpen = true;
  }

  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          this.selectedFile = file;
          // Auto-fill name if empty
          if (!this.newMaterialName) {
              this.newMaterialName = file.name;
          }
      }
  }

  confirmAddMaterial() {
      if (!this.newMaterialName || !this.currentModuleForMaterial) return;
      
      let type = 'LINK';
      let url = '#';

      if (this.selectedFile) {
          // Determine type based on extension mock
          const ext = this.selectedFile.name.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') type = 'PDF';
          else if (['mp4', 'mov', 'avi'].includes(ext || '')) type = 'VIDEO';
          else type = 'FILE'; // Generic

          // Create object URL for demo purposes
          url = URL.createObjectURL(this.selectedFile);
      } 

      const newMaterial = {
          id: `MAT-${Date.now()}`,
          title: this.newMaterialName,
          type: type,
          url: url,
          topicRef: null
      };

      if (!this.currentModuleForMaterial.materials) this.currentModuleForMaterial.materials = [];
      this.currentModuleForMaterial.materials.push(newMaterial);
      
      this.isMaterialModalOpen = false;
      this.newMaterialName = '';
      this.selectedFile = null;
      this.currentModuleForMaterial = null;
  }

  // Confirmation Modal (Generic)
  isConfirmModalOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  openConfirmModal(title: string, message: string, action: () => void) {
      this.confirmTitle = title;
      this.confirmMessage = message;
      this.confirmAction = action;
      this.isConfirmModalOpen = true;
  }

  closeConfirmModal() {
      this.isConfirmModalOpen = false;
      this.confirmAction = null;
  }

  executeConfirmAction() {
      if (this.confirmAction) this.confirmAction();
      this.closeConfirmModal();
  }

  // Updated Methods with Confirmation
  removeModule(index: number) {
      this.openConfirmModal(
          'Eliminar Módulo',
          '¿Estás seguro de eliminar este módulo? Se perderán todos los temas y materiales asociados.',
          () => {
             this.currentCourse.modules.splice(index, 1);
          }
      );
  }

  removeTopic(module: any, index: number) {
      // Optional: Confirm topic deletion too, or keep it snappy if preferred. 
      // Given "Replace alerts with modals", explicit action is safer.
      this.openConfirmModal(
          'Eliminar Tema',
          '¿Eliminar este tema?',
          () => {
              module.topics.splice(index, 1);
          }
      );
  }

  addMaterial(module: any) {
      this.openAddMaterialModal(module);
  }

  removeMaterial(module: any, index: number) {
       this.openConfirmModal(
          'Eliminar Material',
          '¿Eliminar este material?',
          () => {
              module.materials.splice(index, 1);
          }
      );
  }

  getMaterialIcon(type: string): string {
      switch(type) {
          case 'PDF': return 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'; // Doc icon
          case 'VIDEO': return 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z'; // Play icon
          case 'LINK': return 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'; // Link icon
          default: return 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0v5.25m0 0l3-3m-3 3l-3-3';
      }
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
