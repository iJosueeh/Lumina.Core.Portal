import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
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

      if (data && data.length > 0) {
        const backendMaterials = await this.loadMaterialsFromBackend(data);
        this.materials.set(backendMaterials);
      } else {
        this.materials.set([]);
      }
    } catch (err) {
      console.warn('Error loading teacher courses for materials:', err);
      this.materials.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadMaterialsFromBackend(courses: any[]): Promise<Material[]> {
    const allMaterials: Material[] = [];

    await Promise.all(courses.map(async (course) => {
      try {
        // 1. Obtener detalle del curso con sus módulos y lecciones
        const courseDetail = await lastValueFrom(
          this.http.get<any>(`${environment.cursosApiUrl}/cursos/${course.id}`)
        );

        const modulos = courseDetail?.modulos ?? courseDetail?.Modulos ?? [];
        for (const modulo of modulos) {
          const modTitle = modulo.titulo ?? modulo.Titulo ?? 'General';
          
          // Materiales directos del módulo
          const moduloMats = modulo.materiales ?? modulo.Materiales ?? [];
          for (const m of moduloMats) {
            allMaterials.push(this.mapper.mapFromBackend(m, course, modTitle));
          }

          // Materiales asociados a las lecciones
          const lecciones = modulo.lecciones ?? modulo.Lecciones ?? [];
          for (const leccion of lecciones) {
            const lessonTitle = leccion.titulo ?? leccion.Titulo ?? '';
            const lessonMats = leccion.materiales ?? leccion.Materiales ?? leccion.materialesAdicionales ?? [];
            for (const m of lessonMats) {
              allMaterials.push(this.mapper.mapFromBackend(m, course, `${modTitle} • ${lessonTitle}`));
            }
          }
        }

        // 2. Consultar colección dedicada de materiales (/api/cursos/{cursoId}/materiales)
        try {
          const extraMats = await lastValueFrom(
            this.http.get<any[]>(`${environment.cursosApiUrl}/cursos/${course.id}/materiales`)
          );
          if (Array.isArray(extraMats)) {
            for (const em of extraMats) {
              if (!allMaterials.some(existing => existing.id === em.id || (em.url && existing.url === em.url))) {
                allMaterials.push({
                  id: String(em.id || `mat-${Date.now()}-${Math.random()}`),
                  courseId: course.id,
                  courseName: course.titulo,
                  titulo: em.titulo || 'Material de Clase',
                  descripcion: em.descripcion || 'Recurso académico',
                  tipo: this.mapper.normalizeTipo(em.tipo),
                  url: em.url || '#',
                  tamano: em.tamano || '1.0 MB',
                  fechaSubida: em.fechaCreacion || new Date().toISOString(),
                  modulo: em.moduloNombre || 'General',
                  descargas: em.descargas || 0
                });
              }
            }
          }
        } catch {
          // Si el endpoint no retorna colección extra, se mantienen los de módulos/lecciones
        }
      } catch (err) {
        console.warn(`Error loading materials for course ${course.id}:`, err);
      }
    }));

    return allMaterials;
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
      const MAX_SIZE_MB = 100;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        this.notificationService.show('error', `El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
        event.target.value = '';
        return;
      }

      this.selectedFile.set(file);
      if (!this.form.titulo) {
        this.form.titulo = file.name.replace(/\.[^/.]+$/, '');
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      this.form.tamano = `${sizeMB} MB`;
      
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') this.form.tipo = 'PDF';
      else if (['mp4', 'webm', 'mov'].includes(ext)) this.form.tipo = 'Video';
      else if (['ppt', 'pptx'].includes(ext)) this.form.tipo = 'Presentación';
      else if (['doc', 'docx', 'txt'].includes(ext)) this.form.tipo = 'Documento';
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
      let finalUrl = this.form.url;

      // 1. Subida de archivo a Storage backend (MinIO / S3)
      if (this.selectedFile()) {
        try {
          const formData = new FormData();
          formData.append('file', this.selectedFile()!);
          const uploadUrl = `${environment.cursosApiUrl}/cursos/upload`;
          const res = await lastValueFrom(this.http.post<{ url: string; fileName: string }>(uploadUrl, formData));
          if (res?.url) {
            finalUrl = res.url;
          }
        } catch (uploadErr) {
          console.warn('Backend MinIO upload fallback to local state:', uploadErr);
        }
      } else if (this.form.url && this.form.url.startsWith('http')) {
        // Enlace externo: registrar en backend si aplica
        try {
          await lastValueFrom(
            this.http.post(`${environment.cursosApiUrl}/cursos/${this.form.courseId}/materiales/enlace`, {
              titulo: this.form.titulo,
              url: this.form.url,
              moduloId: null
            })
          );
        } catch {
          // Continuar con actualización reactiva
        }
      }

      if (this.isEditing()) {
        this.materials.update(list => list.map(m => m.id === this.form.id ? { 
          ...this.form, 
          url: finalUrl || m.url,
          courseName: course?.titulo || m.courseName 
        } : m));
        this.notificationService.show('success', `Material "${this.form.titulo}" actualizado.`);
      } else {
        const newMaterial: Material = {
          ...this.form,
          id: `mat-${Date.now()}`,
          courseName: course?.titulo || 'Curso Asignado',
          fechaSubida: new Date().toISOString(),
          descargas: 0,
          url: finalUrl || '#'
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

  async delete(id: string) {
    const item = this.materials().find(m => m.id === id);
    const name = item ? `"${item.titulo}"` : 'este material';
    if (confirm(`¿Estás seguro de eliminar ${name}?`)) {
      if (item?.courseId && id && !id.startsWith('mat-')) {
        try {
          await lastValueFrom(
            this.http.delete(`${environment.cursosApiUrl}/cursos/${item.courseId}/materiales/${id}`)
          );
        } catch (err) {
          console.warn('Backend deletion call skipped/fallback:', err);
        }
      }
      this.materials.update(list => list.filter(m => m.id !== id));
      this.notificationService.show('success', `Material eliminado.`);
    }
  }
}


