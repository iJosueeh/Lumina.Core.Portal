import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { AdminDocente } from '@shared/models/admin-course.models';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '@shared/constants/course-categories.constants';

@Component({
  selector: 'app-course-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-settings.component.html',
  styleUrl: './course-settings.component.css'
})
export class CourseSettingsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  courseId = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  isUploading = signal(false);
  loadingDocentes = signal(true);

  docentes = signal<AdminDocente[]>([]);
  categories = [...COURSE_CATEGORIES];
  levels = [...COURSE_LEVELS];

  // Forms por sección
  generalForm: FormGroup;
  academicForm: FormGroup;
  imageForm: FormGroup;

  // Confirm-first: archivo pendiente de subir (no subido aún)
  pendingImageFile = signal<File | null>(null);
  private previewObjectUrl = signal<string | null>(null);

  /** URL para preview: usa preview local si hay archivo pendiente, si no la URL guardada */
  previewImageUrl = computed(() => {
    const localUrl = this.previewObjectUrl();
    if (localUrl) return localUrl;
    return this.imageForm?.get('imagenUrl')?.value || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400';
  });

  /** Live preview del curso */
  preview = computed(() => ({
    name: this.generalForm?.get('nombre')?.value || 'Sin nombre',
    code: this.generalForm?.get('codigo')?.value || '',
    description: this.generalForm?.get('descripcion')?.value || '',
    teacher: this.getTeacherName(this.generalForm?.get('instructorId')?.value),
    status: this.academicForm?.get('estadoCurso')?.value || 'Borrador',
    category: this.academicForm?.get('categoria')?.value || '',
    level: this.academicForm?.get('nivel')?.value || '',
    capacidad: this.academicForm?.get('capacidad')?.value || 0,
    creditos: this.academicForm?.get('creditos')?.value || 0,
    ciclo: this.academicForm?.get('ciclo')?.value || '',
    duracion: this.academicForm?.get('duracion')?.value || '',
  }));

  statusLabel = computed(() => {
    const s = this.preview().status;
    if (s === 'Activo') return 'Público';
    if (s === 'Archivado') return 'Archivado';
    return 'Borrador';
  });

  statusClass = computed(() => {
    const s = this.preview().status;
    if (s === 'Activo') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (s === 'Archivado') return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  });

  constructor() {
    this.generalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      codigo: [''],
      descripcion: ['', [Validators.required]],
      instructorId: [null, [Validators.required]]
    });

    this.academicForm = this.fb.group({
      categoria: ['Programación', [Validators.required]],
      nivel: ['Principiante', [Validators.required]],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      creditos: [4, [Validators.required, Validators.min(1)]],
      duracion: ['20h', [Validators.required]],
      ciclo: ['2026-1', [Validators.required]],
      estadoCurso: ['Borrador']
    });

    this.imageForm = this.fb.group({
      imagenUrl: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadCourseData();
    }
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  private revokePreviewUrl(): void {
    const url = this.previewObjectUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewObjectUrl.set(null);
    }
  }

  private async loadCourseData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [courseDetail, docentes] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${environment.cursosApiUrl}/cursos/${this.courseId()}`)),
        firstValueFrom(this.http.get<any>(`${environment.docentesApiUrl}/docente/system/all`))
      ]);

      const rawDocentes = docentes?.value || docentes || [];
      this.docentes.set(rawDocentes.map((d: any) => ({
        id: d.id?.value || d.id || d.Id,
        nombreCompleto: d.nombreRaw || d.nombre || 'Sin nombre',
        email: d.email || ''
      })));
      this.loadingDocentes.set(false);

      if (courseDetail) {
        const catValue = courseDetail.categoriaRaw || courseDetail.categoria?.value || courseDetail.categoria;
        if (catValue && !this.categories.includes(catValue)) {
          this.categories.push(catValue);
        }

        this.generalForm.patchValue({
          nombre: courseDetail.nombre || courseDetail.titulo,
          codigo: courseDetail.codigo,
          descripcion: courseDetail.descripcion,
          instructorId: courseDetail.instructor?.id || courseDetail.instructorId
        });

        this.academicForm.patchValue({
          categoria: catValue || 'Programación',
          nivel: courseDetail.nivelRaw || courseDetail.nivel?.value || courseDetail.nivel || 'Principiante',
          capacidad: courseDetail.capacidad || 30,
          creditos: courseDetail.creditos || 4,
          duracion: courseDetail.duracion || '20h',
          ciclo: (!courseDetail.ciclo || courseDetail.ciclo === 'N/A') ? '2026-1' : courseDetail.ciclo,
          estadoCurso: courseDetail.estadoCurso || 'Borrador'
        });

        this.imageForm.patchValue({
          imagenUrl: courseDetail.imagenUrl || courseDetail.imagen || ''
        });
      }
    } catch {
      this.notificationService.show('error', 'No se pudo cargar la información del curso.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getTeacherName(instructorId: any): string {
    if (!instructorId) return 'Sin asignar';
    const docente = this.docentes().find(d => String(d.id) === String(instructorId));
    return docente?.nombreCompleto || 'Sin asignar';
  }

  /** Selecciona archivo pero NO sube — solo genera preview local */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.notificationService.show('error', 'Solo se permiten archivos de imagen.');
      input.value = '';
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.show('error', 'La imagen no debe exceder 5MB.');
      input.value = '';
      return;
    }

    // Revocar preview anterior
    this.revokePreviewUrl();

    // Guardar archivo pendiente + generar preview local
    this.pendingImageFile.set(file);
    const localUrl = URL.createObjectURL(file);
    this.previewObjectUrl.set(localUrl);

    this.notificationService.show('info', 'Imagen seleccionada. Presiona Guardar para aplicar.');
    input.value = '';
  }

  /** Guarda todo: sube imagen pendiente primero, luego PUT */
  async saveAll(): Promise<void> {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      this.notificationService.show('error', 'Revisa los campos de Información General.');
      return;
    }
    if (this.academicForm.invalid) {
      this.academicForm.markAllAsTouched();
      this.notificationService.show('error', 'Revisa los campos de Configuración Académica.');
      return;
    }

    this.isSaving.set(true);
    try {
      // 1. Si hay archivo pendiente, subirlo PRIMERO
      const pendingFile = this.pendingImageFile();
      if (pendingFile) {
        this.isUploading.set(true);
        try {
          const formData = new FormData();
          formData.append('file', pendingFile);
          const response = await firstValueFrom(
            this.http.post<{ url: string }>(`${environment.cursosApiUrl}/cursos/upload`, formData)
          );
          this.imageForm.patchValue({ imagenUrl: response.url });
          this.revokePreviewUrl();
          this.pendingImageFile.set(null);
        } finally {
          this.isUploading.set(false);
        }
      }

      // 2. PUT con todos los campos
      const fullPayload = {
        ...this.generalForm.value,
        ...this.academicForm.value,
        ...this.imageForm.value
      };
      await firstValueFrom(this.http.put(`${environment.cursosApiUrl}/cursos/${this.courseId()}`, fullPayload));
      this.notificationService.show('success', 'Cambios guardados correctamente.');
    } catch (err: any) {
      const msg = err?.error?.error || 'Error al guardar los cambios.';
      this.notificationService.show('error', msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/courses']);
  }
}
