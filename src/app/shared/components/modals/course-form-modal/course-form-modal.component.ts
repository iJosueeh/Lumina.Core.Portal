import { Component, EventEmitter, Input, OnInit, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';
import { NotificationService } from '@shared/services/notification.service';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '@shared/constants/course-categories.constants';

@Component({
  selector: 'app-course-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-form-modal.component.html',
  styleUrl: './course-form-modal.component.css'
})
export class CourseFormModalComponent implements OnInit {
  @Input() courseToEdit: AdminCourse | null = null;
  @Input() docentes: AdminDocente[] = [];

  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  courseForm: FormGroup;
  isSaving = signal(false);
  isUploading = signal(false);
  loadingDocentes = signal(false);

  requisitosList = signal<string[]>([]);
  newRequisito = signal('');

  categories = signal<string[]>([]);
  levels = [...COURSE_LEVELS];

  constructor() {
    this.courseForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      codigo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      instructorId: [null, [Validators.required]],
      categoria: ['Programación', [Validators.required]],
      nivel: ['Principiante', [Validators.required]],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      creditos: [4, [Validators.required, Validators.min(1)]],
      duracion: ['20h', [Validators.required]],
      ciclo: ['2026-1', [Validators.required]],
      precio: [0, [Validators.required]],
      imagenUrl: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
      estadoCurso: ['Borrador']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.courseToEdit) {
      this.patchCourseForm();
      this.loadFullDetail();
    }
  }

  private patchCourseForm(): void {
    if (!this.courseToEdit) return;

    this.courseForm.patchValue({
      nombre: this.courseToEdit.name,
      codigo: this.courseToEdit.code,
      descripcion: this.courseToEdit.description,
      instructorId: this.courseToEdit.instructorId,
      categoria: this.courseToEdit.categoria || 'Programación',
      nivel: this.courseToEdit.nivel || 'Principiante',
      capacidad: this.courseToEdit.capacity,
      creditos: this.courseToEdit.creditos,
      duracion: this.courseToEdit.duracion || '20h',
      ciclo: (this.courseToEdit.ciclo === 'N/A' || !this.courseToEdit.ciclo) ? '2026-1' : this.courseToEdit.ciclo,
      precio: this.courseToEdit.precio || 0,
      imagenUrl: this.courseToEdit.coverImage,
      estadoCurso: this.mapStatus(this.courseToEdit.status)
    });

    this.courseForm.updateValueAndValidity();
  }

  private mapStatus(status: string | undefined): string {
    if (!status) return 'Borrador';
    const s = status.toUpperCase();
    if (s === 'PUBLISHED' || s === 'ACTIVO') return 'Activo';
    if (s === 'ARCHIVED') return 'Archivado';
    return 'Borrador';
  }

  private async loadCategories() {
    try {
      const cats = await firstValueFrom(this.http.get<string[]>(`${environment.cursosApiUrl}/cursos/categorias`));
      this.categories.set(cats?.length ? cats : [...COURSE_CATEGORIES]);
    } catch {
      this.categories.set([...COURSE_CATEGORIES]);
    }
  }

  private async loadFullDetail() {
    if (!this.courseToEdit?.id) return;
    try {
      const detail = await firstValueFrom(this.http.get<any>(`${environment.cursosApiUrl}/cursos/${this.courseToEdit.id}`));
      if (detail) {
        const catValue = detail.categoriaRaw || detail.categoria?.value || detail.categoria;
        if (catValue && !this.categories().includes(catValue)) {
          this.categories.update(prev => [...prev, catValue]);
        }

        this.courseForm.patchValue({
          categoria: catValue || 'Programación',
          nivel: detail.nivelRaw || detail.nivel?.value || detail.nivel || 'Principiante',
          precio: detail.precio || 0,
          duracion: detail.duracion || '20h',
          estadoCurso: detail.estadoCurso || 'Borrador'
        }, { emitEvent: false });

        if (Array.isArray(detail.requisitos)) {
          this.requisitosList.set(detail.requisitos);
        }

        this.courseForm.updateValueAndValidity();
      }
    } catch { /* optional */ }
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file) {
      this.isUploading.set(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await firstValueFrom(
          this.http.post<any>(`${environment.cursosApiUrl}/cursos/upload`, formData)
        );
        this.courseForm.patchValue({ imagenUrl: response.url });
        this.notificationService.show('success', 'Imagen subida correctamente.');
      } catch {
        this.notificationService.show('error', 'No se pudo subir la imagen.');
      }
      this.isUploading.set(false);
    }
  }

  addRequisito(): void {
    const val = this.newRequisito().trim();
    if (val) {
      this.requisitosList.update(list => [...list, val]);
      this.newRequisito.set('');
    }
  }

  removeRequisito(index: number): void {
    this.requisitosList.update(list => list.filter((_, i) => i !== index));
  }

  async submit(): Promise<void> {
    if (this.courseForm.invalid || !this.courseToEdit?.id) {
      this.courseForm.markAllAsTouched();
      this.notificationService.show('error', 'El formulario contiene errores.');
      return;
    }

    this.isSaving.set(true);
    const v = this.courseForm.value;

    let instructorIdStr = v.instructorId;
    if (instructorIdStr && typeof instructorIdStr === 'object' && instructorIdStr.value) {
      instructorIdStr = instructorIdStr.value;
    }

    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      capacidad: Number(v.capacidad),
      nivel: v.nivel,
      duracion: v.duracion,
      precio: Number(v.precio),
      imagenUrl: v.imagenUrl,
      categoria: v.categoria,
      instructorId: instructorIdStr || null,
      requisitos: this.requisitosList(),
      codigo: v.codigo,
      creditos: Number(v.creditos),
      ciclo: v.ciclo,
      estadoCurso: v.estadoCurso || 'Borrador'
    };

    try {
      await firstValueFrom(this.http.put(`${environment.cursosApiUrl}/cursos/${this.courseToEdit.id}`, payload));
      this.notificationService.show('success', 'Curso actualizado correctamente.');
      this.onSaved.emit();
      this.onClose.emit();
    } catch (err: any) {
      if (err.error?.errors) {
        const [field, messages] = Object.entries(err.error.errors)[0] as [string, any];
        this.notificationService.show('error', `Error en ${field}: ${Array.isArray(messages) ? messages[0] : messages}`);
      } else {
        this.notificationService.show('error', 'Error del servidor. Verifica los datos.');
      }
    }
    this.isSaving.set(false);
  }
}
