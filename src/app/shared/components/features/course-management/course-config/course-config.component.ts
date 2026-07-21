import { Component, Input, OnInit, OnChanges, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { AdminDocente } from '@shared/models/admin-course.models';
import { COURSE_CATEGORIES, COURSE_LEVELS } from '@shared/constants/course-categories.constants';

@Component({
  selector: 'app-course-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">

      <!-- Sección: Info General -->
      <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Información General</h3>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Datos básicos del curso</p>
          </div>
          <button (click)="saveGeneralInfo()" [disabled]="!generalForm.dirty || isSaving()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2">
            @if (isSaving()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-check"></i> Guardar
            }
          </button>
        </div>

        <form [formGroup]="generalForm" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2 space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre del Curso</label>
              <input type="text" formControlName="nombre"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium">
            </div>

            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Código</label>
              <input type="text" formControlName="codigo"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium">
            </div>

            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Docente Asignado</label>
              <select formControlName="instructorId" (change)="onDocenteChanged()"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium appearance-none">
                <option [ngValue]="null" disabled>Seleccionar docente...</option>
                @for (d of docentes; track d.id) {
                  <option [ngValue]="d.id">{{ d.nombreCompleto }}</option>
                }
              </select>
            </div>

            <div class="md:col-span-2 space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
              <textarea formControlName="descripcion" rows="3"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none text-sm leading-relaxed"></textarea>
            </div>
          </div>
        </form>
      </section>

      <!-- Sección: Configuración Académica -->
      <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Configuración Académica</h3>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Parámetros y visibilidad</p>
          </div>
          <button (click)="saveAcademicConfig()" [disabled]="!academicForm.dirty || isSaving()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2">
            @if (isSaving()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-check"></i> Guardar
            }
          </button>
        </div>

        <form [formGroup]="academicForm" class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
            <select formControlName="categoria"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium appearance-none">
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nivel</label>
            <select formControlName="nivel"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium appearance-none">
              @for (lvl of levels; track lvl) {
                <option [value]="lvl">{{ lvl }}</option>
              }
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Capacidad</label>
            <input type="number" formControlName="capacidad"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium">
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Duración</label>
            <input type="text" formControlName="duracion" placeholder="Ej: 40h"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium placeholder:text-slate-300">
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Créditos</label>
            <input type="number" formControlName="creditos"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium">
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ciclo</label>
            <input type="text" formControlName="ciclo" placeholder="2026-1"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium placeholder:text-slate-300">
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Precio (S/)</label>
            <input type="number" formControlName="precio" min="0"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium">
          </div>

          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">Estado</label>
            <select formControlName="estadoCurso"
              class="w-full bg-slate-50 border border-indigo-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium appearance-none">
              <option value="Activo">Activo / Público</option>
              <option value="Borrador">Borrador / Privado</option>
              <option value="Archivado">Archivado</option>
            </select>
          </div>
        </form>
      </section>

      <!-- Sección: Imagen -->
      <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Imagen de Portada</h3>
            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Vista previa del curso</p>
          </div>
          <button (click)="saveImage()" [disabled]="!imageForm.dirty || isSaving()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2">
            @if (isSaving()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-check"></i> Guardar
            }
          </button>
        </div>

        <div class="flex gap-6 items-start">
          <div class="w-48 h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
            <img [src]="imageForm.get('imagenUrl')?.value || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'"
              class="w-full h-full object-cover" alt="Portada"
              (error)="$any($event.target).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'">
          </div>
          <div class="flex-1 space-y-3">
            <div class="flex gap-3">
              <input type="text" formControlName="imagenUrl" placeholder="URL de la imagen..."
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-300">
              <label class="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"
                [class.opacity-50]="isUploading()">
                @if (isUploading()) {
                  <i class="fas fa-spinner fa-spin"></i>
                } @else {
                  <i class="fas fa-cloud-upload-alt text-lg"></i>
                }
                <input type="file" (change)="onFileSelected($event)" class="hidden" accept="image/*" [disabled]="isUploading()">
              </label>
            </div>
            <p class="text-[11px] text-slate-400">Pega una URL o sube una imagen (JPG, PNG, WebP). Máx 5MB.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class CourseConfigComponent implements OnInit {
  @Input() courseId!: string;
  @Input() initialData: any = null;
  @Input() docentes: AdminDocente[] = [];

  @Output() onSaved = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  isSaving = signal(false);
  isUploading = signal(false);

  categories = [...COURSE_CATEGORIES];
  levels = [...COURSE_LEVELS];

  generalForm: FormGroup;
  academicForm: FormGroup;
  imageForm: FormGroup;

  constructor() {
    this.generalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      codigo: ['', [Validators.required]],
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
      precio: [0, [Validators.required]],
      estadoCurso: ['Borrador']
    });

    this.imageForm = this.fb.group({
      imagenUrl: ['']
    });
  }

  ngOnInit(): void {
    if (this.initialData) {
      this.patchForms(this.initialData);
    }
  }

  ngOnChanges(): void {
    if (this.initialData) {
      this.patchForms(this.initialData);
    }
  }

  private patchForms(data: any): void {
    this.generalForm.patchValue({
      nombre: data.name || data.nombre,
      codigo: data.code || data.codigo,
      descripcion: data.description || data.descripcion,
      instructorId: data.instructorId
    }, { emitEvent: false });

    this.academicForm.patchValue({
      categoria: data.categoria || 'Programación',
      nivel: data.nivel || 'Principiante',
      capacidad: data.capacity || data.capacidad || 30,
      creditos: data.creditos || 4,
      duracion: data.duracion || '20h',
      ciclo: (!data.ciclo || data.ciclo === 'N/A') ? '2026-1' : data.ciclo,
      precio: data.precio || 0,
      estadoCurso: data.status || data.estadoCurso || 'Borrador'
    }, { emitEvent: false });

    this.imageForm.patchValue({
      imagenUrl: data.coverImage || data.imagenUrl || ''
    }, { emitEvent: false });
  }

  onDocenteChanged(): void {
    this.generalForm.markAsDirty();
  }

  async saveGeneralInfo(): Promise<void> {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }
    await this.savePartial(this.generalForm.value);
  }

  async saveAcademicConfig(): Promise<void> {
    if (this.academicForm.invalid) {
      this.academicForm.markAllAsTouched();
      return;
    }
    await this.savePartial(this.academicForm.value);
  }

  async saveImage(): Promise<void> {
    await this.savePartial(this.imageForm.value);
  }

  private async savePartial(payload: Record<string, any>): Promise<void> {
    this.isSaving.set(true);
    try {
      await firstValueFrom(this.http.put(`${environment.cursosApiUrl}/cursos/${this.courseId}`, payload));
      this.notificationService.show('success', 'Cambios guardados correctamente.');
      this.generalForm.markAsPristine();
      this.academicForm.markAsPristine();
      this.imageForm.markAsPristine();
      this.onSaved.emit('Curso actualizado');
    } catch (err: any) {
      const msg = err?.error?.error || 'Error al guardar los cambios.';
      this.notificationService.show('error', msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await firstValueFrom(
        this.http.post<{ url: string }>(`${environment.cursosApiUrl}/cursos/upload`, formData)
      );
      this.imageForm.patchValue({ imagenUrl: response.url });
      this.imageForm.markAsDirty();
      this.notificationService.show('success', 'Imagen subida. Presiona Guardar para aplicar.');
    } catch {
      this.notificationService.show('error', 'No se pudo subir la imagen.');
    } finally {
      this.isUploading.set(false);
      input.value = '';
    }
  }
}
