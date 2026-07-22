import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminCourseService } from '../../../infrastructure/services/admin-course.service';
import { AdminDocente } from '@shared/models/admin-course.models';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '@shared/constants/course-categories.constants';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-create.component.html',
  styleUrl: './course-create.component.css'
})
export class CourseCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminCourseService);

  currentStep = signal(1);
  isSaving = signal(false);
  isUploading = signal(false);
  loadingDocentes = signal(true);

  categories = signal<string[]>([...COURSE_CATEGORIES]);
  levels = [...COURSE_LEVELS];
  docentes = signal<AdminDocente[]>([]);
  requisitosList = signal<string[]>([]);
  newRequisito = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal('');
  form: FormGroup;
  previewImageUrl = computed(() => this.previewUrl() || this.form?.get('imagenUrl')?.value || '');

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      codigo: ['', [Validators.required]],
      instructorId: [null, [Validators.required]],
      descripcion: ['', [Validators.required]],
      categoria: ['Programación', [Validators.required]],
      nivel: ['Principiante', [Validators.required]],
      capacidad: [30, [Validators.required, Validators.min(1)]],
      duracion: ['20h', [Validators.required]],
      creditos: [4, [Validators.required, Validators.min(1)]],
      ciclo: ['2026-1', [Validators.required]],
      estadoCurso: ['Borrador'],
      imagenUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocentes();
    this.loadCategories();
  }

  private loadDocentes() {
    this.loadingDocentes.set(true);
    this.adminService.getDocentes().subscribe({
      next: (data) => {
        this.docentes.set(data);
        this.loadingDocentes.set(false);
      },
      error: () => {
        this.docentes.set([]);
        this.loadingDocentes.set(false);
      }
    });
  }

  private async loadCategories() {
    try {
      const cats = await firstValueFrom(
        this.http.get<string[]>(`${environment.cursosApiUrl}/cursos/categorias`)
      );
      if (cats?.length) this.categories.set(cats);
    } catch { /* keep defaults */ }
  }

  // --- Stepper ---
  canGoStep2(): boolean {
    const f = this.form;
    return f.get('nombre')?.valid === true && f.get('codigo')?.valid === true
        && f.get('instructorId')?.valid === true && f.get('descripcion')?.valid === true;
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1) {
      if (this.canGoStep2()) {
        this.currentStep.set(2);
      } else {
        ['nombre', 'codigo', 'instructorId', 'descripcion'].forEach(f => this.form.get(f)?.markAsTouched());
        this.notificationService.show('error', 'Completa los campos esenciales.');
      }
    } else if (step === 2) {
      this.currentStep.set(3);
    } else if (step === 3) {
      this.submit();
    }
  }

  prevStep(): void { this.currentStep.update(s => s - 1); }

  // --- Requisitos ---
  addRequisito(): void {
    const val = this.newRequisito().trim();
    if (val) {
      this.requisitosList.update(list => [...list, val]);
      this.newRequisito.set('');
    }
  }

  removeRequisito(i: number): void {
    this.requisitosList.update(list => list.filter((_, idx) => idx !== i));
  }

  // --- Image (local preview, upload on submit) ---
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const url = URL.createObjectURL(file);
    this.previewUrl.set(url);
  }

  private async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await firstValueFrom(
      this.http.post<any>(`${environment.cursosApiUrl}/cursos/upload`, formData)
    );
    return response.url;
  }

  // --- Submit ---
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.show('error', 'Corrige los errores del formulario.');
      return;
    }

    this.isSaving.set(true);

    // Upload file first if selected
    let imagenUrl = this.form.get('imagenUrl')?.value || '';
    const file = this.selectedFile();
    if (file) {
      try {
        imagenUrl = await this.uploadFile(file);
      } catch {
        this.notificationService.show('error', 'Error al subir la imagen.');
        this.isSaving.set(false);
        return;
      }
    }

    const v = this.form.value;

    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      capacidad: Number(v.capacidad),
      nivel: v.nivel,
      duracion: v.duracion,
      precio: 0,
      imagenUrl,
      categoria: v.categoria,
      instructorId: typeof v.instructorId === 'object' ? v.instructorId?.value : v.instructorId,
      requisitos: this.requisitosList(),
      codigo: v.codigo,
      creditos: Number(v.creditos),
      ciclo: v.ciclo,
      estadoCurso: v.estadoCurso || 'Borrador'
    };

    try {
      await firstValueFrom(this.http.post(`${environment.cursosApiUrl}/cursos`, payload));
      this.notificationService.show('success', 'Curso creado exitosamente.');
      this.router.navigate(['/admin/courses']);
    } catch (err: any) {
      if (err.error?.errors) {
        const [field, msgs] = Object.entries(err.error.errors)[0] as [string, any];
        this.notificationService.show('error', `Error en ${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`);
      } else {
        this.notificationService.show('error', 'Error del servidor.');
      }
    }
    this.isSaving.set(false);
  }

  goBack(): void { this.router.navigate(['/admin/courses']); }
}
