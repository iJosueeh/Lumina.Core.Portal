import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { MaterialsMapper } from '@shared/mappers/materials.mapper';

// UI Components
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
    CommonModule, FormsModule, MaterialCardComponent, ModalContainerComponent, 
    ButtonComponent, FormFieldComponent, InputComponent, SelectComponent, SkeletonLoaderComponent
  ],
  templateUrl: './materials-management.component.html',
})
export class MaterialsManagementComponent implements OnInit {
  private authRepo = inject(AuthRepository);
  private teacherQuery = inject(TeacherQueryService);
  private mapper = inject(MaterialsMapper);

  isLoading = signal(true);
  courses = signal<any[]>([]);
  materials = signal<Material[]>([]);
  selectedCourseId = signal('all');
  selectedTipo = signal('all');
  searchTerm = signal('');
  
  showModal = signal(false);
  isEditing = signal(false);
  form: any = this.emptyForm();

  readonly tipos: MaterialTipo[] = ['PDF', 'Video', 'Enlace', 'Presentación', 'Documento'];

  filteredMaterials = computed(() => {
    let items = this.materials();
    const cid = this.selectedCourseId();
    const type = this.selectedTipo();
    const term = this.searchTerm().toLowerCase();

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
    } catch { } finally { this.isLoading.set(false); }
  }

  private emptyForm() {
    return { courseId: '', titulo: '', descripcion: '', tipo: 'PDF', url: '', tamano: '0 MB', modulo: 'General' };
  }

  openAdd() {
    this.isEditing.set(false);
    this.form = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(m: Material) {
    this.isEditing.set(true);
    this.form = { ...m };
    this.showModal.set(true);
  }

  save() {
    const course = this.courses().find(c => c.id === this.form.courseId);
    if (this.isEditing()) {
      this.materials.update(list => list.map(m => m.id === this.form.id ? { ...this.form, courseName: course?.titulo } : m));
    } else {
      this.materials.update(list => [{ ...this.form, id: `mat-${Date.now()}`, courseName: course?.titulo, fechaSubida: new Date().toISOString(), descargas: 0 }, ...list]);
    }
    this.showModal.set(false);
  }

  delete(id: string) {
    if (confirm('¿Eliminar este material?')) this.materials.update(list => list.filter(m => m.id !== id));
  }
}

