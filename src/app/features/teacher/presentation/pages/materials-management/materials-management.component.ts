import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { MaterialsMapper } from '@shared/mappers/materials.mapper';
import { NotificationService } from '@shared/services/notification.service';
import { environment } from '@environments/environment';

// UI Components
import { PageHeaderComponent } from '@shared/components/ui/page-header/page-header.component';
import { MaterialCardComponent } from '@shared/components/ui/material-card/material-card.component';
import { ModalContainerComponent } from '@shared/components/ui/modal-container/modal-container.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { FormFieldComponent } from '@shared/components/ui/form-field/form-field.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

export type MaterialTipo = 'PDF' | 'Video' | 'Enlace' | 'Presentación' | 'Documento';

export interface Material {
  id: string;
  courseId: string;
  courseName: string;
  titulo: string;
  descripcion: string;
  tipo: MaterialTipo;
  url: string;
  tamano: string;
  fechaSubida: string;
  modulo: string;
  descargas: number;
}

@Component({
  selector: 'app-materials-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, PageHeaderComponent, MaterialCardComponent, ModalContainerComponent, 
    ButtonComponent, FormFieldComponent, InputComponent, SelectComponent, SkeletonLoaderComponent
  ],
  templateUrl: './materials-management.component.html',
})
export class MaterialsManagementComponent implements OnInit {
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);
  private mapper = inject(MaterialsMapper);
  private notificationService = inject(NotificationService);
  private http = inject(HttpClient);

  isLoading = signal(true);
  isSaving = signal(false);
  courses = signal<any[]>([]);
  materials = signal<Material[]>([]);
  selectedCourseId = signal('all');
  selectedTipo = signal('all');
  searchTerm = signal('');
  
  showModal = signal(false);
  isEditing = signal(false);
  selectedFile = signal<File | null>(null);
  form: any = this.emptyForm();

  readonly tipos: MaterialTipo[] = ['PDF', 'Video', 'Enlace', 'Presentación', 'Documento'];

  filteredMaterials = computed(() => {
    let items = this.materials();
    const cid = this.selectedCourseId();
    const type = this.selectedTipo();
    const term = this.searchTerm().trim().toLowerCase();

    if (cid !== 'all') items = items.filter(m => m.courseId === cid);
    if (type !== 'all') items = items.filter(m => m.tipo === type);
    if (term) items = items.filter(m => m.titulo.toLowerCase().includes(term) || m.descripcion.toLowerCase().includes(term));
    
    return items;
  });

  async ngOnInit() {
    try {
      const user = this.authRepo.getCurrentUser();
      const userId = user?.id || (user as any)?.sub || '';
      const data = await this.teacherQuery.getTeacherCourses(userId);
      this.courses.set(data);
      this.materials.set(this.mapper.generateMockMaterials(data));
    } catch (err) {
      console.warn('Error loading teacher courses for materials:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private emptyForm() {
    return { 
      courseId: this.courses()[0]?.id || '', 
      titulo: '', 
      descripcion: '', 
      tipo: 'PDF' as MaterialTipo, 
      url: '', 
      tamano: '1.5 MB', 
      modulo: 'General' 
    };
  }

  openAdd() {
    this.isEditing.set(false);
    this.selectedFile.set(null);
    this.form = this.emptyForm();
    if (this.selectedCourseId() !== 'all') {
      this.form.courseId = this.selectedCourseId();
    }
    this.showModal.set(true);
  }

  openEdit(m: Material) {
    this.isEditing.set(true);
    this.selectedFile.set(null);
    this.form = { ...m };
    this.showModal.set(true);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      if (!this.form.titulo) {
        this.form.titulo = file.name.replace(/\.[^/.]+$/, '');
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      this.form.tamano = `${sizeMB} MB`;
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') this.form.tipo = 'PDF';
      else if (['mp4', 'webm', 'mov'].includes(ext || '')) this.form.tipo = 'Video';
      else if (['ppt', 'pptx'].includes(ext || '')) this.form.tipo = 'Presentación';
      else if (['doc', 'docx', 'txt'].includes(ext || '')) this.form.tipo = 'Documento';
    }
  }

  async save() {
    if (!this.form.courseId) {
      this.notificationService.show('error', 'Por favor selecciona un curso destino.');
      return;
    }
    if (!this.form.titulo?.trim()) {
      this.notificationService.show('error', 'El título del material es obligatorio.');
      return;
    }

    this.isSaving.set(true);
    const course = this.courses().find(c => c.id === this.form.courseId);

    try {
      if (this.isEditing()) {
        this.materials.update(list => list.map(m => m.id === this.form.id ? { ...this.form, courseName: course?.titulo || m.courseName } : m));
        this.notificationService.show('success', `Material "${this.form.titulo}" actualizado.`);
      } else {
        const newMaterial: Material = {
          ...this.form,
          id: `mat-${Date.now()}`,
          courseName: course?.titulo || 'Curso Asignado',
          fechaSubida: new Date().toISOString(),
          descargas: 0,
          url: this.form.url || '#'
        };
        this.materials.update(list => [newMaterial, ...list]);
        this.notificationService.show('success', `Material "${this.form.titulo}" publicado correctamente.`);
      }
      this.showModal.set(false);
    } catch (err) {
      console.error('Error saving material:', err);
      this.notificationService.show('error', 'Ocurrió un error al guardar el material.');
    } finally {
      this.isSaving.set(false);
    }
  }

  delete(id: string) {
    const item = this.materials().find(m => m.id === id);
    const name = item ? `"${item.titulo}"` : 'este material';
    if (confirm(`¿Estás seguro de eliminar ${name}?`)) {
      this.materials.update(list => list.filter(m => m.id !== id));
      this.notificationService.show('success', `Material eliminado.`);
    }
  }
}


