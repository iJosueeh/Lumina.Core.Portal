# Página Independiente de Creación de Curso (Stepper)

> **Para Hermes:** Plan de implementación para migrar creación de curso de modal a página independiente con stepper por etapas.

**Goal:** Reemplazar el modal de creación de curso con una página independiente `/admin/course/create` con stepper de 3 pasos (minimalista, light theme, sin código innecesario).

**Architecture:** Página standalone con stepper visual en header, formularios por etapas, y redirect al course-table al completar. El modal `CourseFormModalComponent` se mantiene SOLO para edición (ya funciona).

**Tech Stack:** Angular standalone component, Reactive Forms, Tailwind CSS, signal-based state.

---

## Contexto Actual

| Elemento | Estado actual |
|----------|---------------|
| Creación | Modal `CourseFormModalComponent` con stepper de 2 pasos |
| Edición | Mismo modal con formulario directo (sin stepper) |
| Ajustes | Página independiente `CourseSettingsComponent` en `/admin/course/:id/settings` |
| Backend | `POST /api/cursos` acepta `CrearCursoRequestDto` (14 campos) |
| Table | Botón "+" navega a `showCourseFormModal.set(true)` |

## Propuesta: 3 Pasos

| Paso | Nombre | Campos | Validación |
|------|--------|--------|------------|
| 1 | **Información Esencial** | nombre, código, docente, descripción | required + minLength(5) |
| 2 | **Configuración Académica** | categoría, nivel, capacidad, duración, créditos, ciclo, estado | required |
| 3 | **Portada & Requisitos** | imagen (URL/upload), requisitos (tags) | opcional |

**Después de crear** → redirect a `/admin/courses`.

---

## Plan de Implementación

### Task 1: Crear componente `CourseCreateComponent`

**Objetivo:** Archivos base del componente standalone (TS + HTML + CSS).

**Files:**
- Create: `features/admin/presentation/pages/course-create/course-create.component.ts`
- Create: `features/admin/presentation/pages/course-create/course-create.component.html`
- Create: `features/admin/presentation/pages/course-create/course-create.component.css`

**course-create.component.ts (~120 líneas):**
```typescript
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  currentStep = signal(1);
  isSaving = signal(false);
  isUploading = signal(false);
  loadingDocentes = signal(true);

  categories = signal<string[]>([...COURSE_CATEGORIES]);
  levels = [...COURSE_LEVELS];
  docentes = signal<any[]>([]);
  requisitosList = signal<string[]>([]);
  newRequisito = signal('');

  form: FormGroup;

  // Preview computed
  previewImageUrl = computed(() => this.form?.get('imagenUrl')?.value || '');

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
      imagenUrl: [''],
      requisitos: [[]]
    });
  }

  ngOnInit(): void {
    this.loadDocentes();
    this.loadCategories();
  }

  private async loadDocentes() {
    this.loadingDocentes.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<any[]>(`${environment.docentesApiUrl}/docente/system/all`)
      );
      this.docentes.set(data?.value || data || []);
    } catch { this.docentes.set([]); }
    this.loadingDocentes.set(false);
  }

  private async loadCategories() {
    try {
      const cats = await firstValueFrom(this.http.get<string[]>(
        `${environment.cursosApiUrl}/cursos/categorias`
      ));
      if (cats?.length) this.categories.set(cats);
    } catch { /* fallback to defaults */ }
  }

  // --- Stepper navigation ---
  canGoStep2 = computed(() => {
    const f = this.form;
    return f.get('nombre')?.valid && f.get('codigo')?.valid
        && f.get('instructorId')?.valid && f.get('descripcion')?.valid;
  });

  nextStep(): void {
    const step1Fields = ['nombre', 'codigo', 'instructorId', 'descripcion'];
    if (this.canGoStep2()) {
      this.currentStep.set(2);
    } else {
      step1Fields.forEach(f => this.form.get(f)?.markAsTouched());
      this.notificationService.show('error', 'Completa los campos esenciales.');
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

  // --- Image upload ---
  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.isUploading.set(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.cursosApiUrl}/cursos/upload`, formData)
      );
      this.form.patchValue({ imagenUrl: response.url });
      this.notificationService.show('success', 'Imagen subida.');
    } catch {
      this.notificationService.show('error', 'Error al subir imagen.');
    }
    this.isUploading.set(false);
  }

  // --- Submit ---
  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.show('error', 'Corrige los errores del formulario.');
      return;
    }

    this.isSaving.set(true);
    const v = this.form.value;

    const payload = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      capacidad: Number(v.capacidad),
      nivel: v.nivel,
      duracion: v.duracion,
      precio: 0,
      imagenUrl: v.imagenUrl,
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
```

**course-create.component.html (~180 líneas):**
Estructura similar a settings: header con stepper visual + contenido por pasos.
- Header: botón ← + stepper visual (1→2→3) + botón "Crear" (solo paso 3)
- Paso 1: grid 2 cols — nombre, código, docente (con loading placeholder), descripción
- Paso 2: grid 3 cols — categoría, nivel, capacidad, duración, créditos, ciclo, estado
- Paso 3: imagen upload + requisitos tags
- Footer: Anterior / Siguiente / Crear

**course-create.component.css (~5 líneas):**
```css
:host { display: block; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
```

---

### Task 2: Agregar ruta en `AdminRoutingModule`

**Objetivo:** Registrar la nueva página.

**Files:**
- Modify: `features/admin/admin-routing-module.ts`

**Cambios:**
Agregar route después de `course/:id/settings`:
```typescript
{
  path: 'course/create',
  loadComponent: () => import('./presentation/pages/course-create/course-create.component').then(m => m.CourseCreateComponent)
},
```

---

### Task 3: Actualizar CourseManagement — botón crear navega a página

**Objetivo:** Reemplazar `showCourseFormModal.set(true)` por `router.navigate`.

**Files:**
- Modify: `features/admin/presentation/pages/course-management/course-management.ts`
- Modify: `features/admin/presentation/pages/course-management/course-management.html`

**TS changes:**
- Agregar `private router = inject(Router)` 
- `openCreateModal()` → `this.router.navigate(['/admin/course/create'])`
- Eliminar import de `CourseFormModalComponent` y `EvaluacionModalComponent` si no se usan
- Eliminar `showCourseFormModal`, `courseToEdit` signals

**HTML changes:**
- Eliminar modal `<app-course-form-modal>` del template
- Eliminar modal `<app-evaluacion-modal>` si no se usa

---

### Task 4: Limpiar CourseFormModalComponent — solo modo edición

**Objetivo:** Eliminar código de creación del modal (ya no se usa).

**Files:**
- Modify: `shared/components/modals/course-form-modal/course-form-modal.component.ts`
- Modify: `shared/components/modals/course-form-modal/course-form-modal.component.html`

**TS changes:**
- Eliminar `currentStep`, `nextStep()`, `prevStep()`
- Eliminar `isEditMode` computed (siempre true)
- Mantener: form, requisitos, image upload, submit (PUT only)

**HTML changes:**
- Eliminar bloque `@if (!isEditMode())` (stepper)
- Mantener bloque `@if (isEditMode())` (formulario directo)
- Eliminar stepper visual
- Cambiar título a "Editar Curso"
- Eliminar botón "X" de cerrar → reemplazar por onCancel
- Eliminar paso 1 / paso 2 → mostrar todo directo

---

### Task 5: Build + verificar

**Objetivo:** Verificar que todo compila.

**Commands:**
```bash
cd Lumina.Core.Portal && npx ng build
cd Lumina.Core && dotnet build
```

**Expected:** 0 TS errors, 0 backend errors.

---

### Task 6: Docker rebuild backend

**Objetivo:** Actualizar contenedor si hay cambios backend.

**Commands:**
```bash
cd Lumina.Core && docker-compose build cursos && docker-compose up -d cursos
```

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `features/admin/presentation/pages/course-create/course-create.component.ts` | **Crear** |
| `features/admin/presentation/pages/course-create/course-create.component.html` | **Crear** |
| `features/admin/presentation/pages/course-create/course-create.component.css` | **Crear** |
| `features/admin/admin-routing-module.ts` | Modificar (agregar ruta) |
| `features/admin/presentation/pages/course-management/course-management.ts` | Modificar (navigate, limpiar signals) |
| `features/admin/presentation/pages/course-management/course-management.html` | Modificar (eliminar modal) |
| `shared/components/modals/course-form-modal/course-form-modal.component.ts` | Modificar (solo edición) |
| `shared/components/modals/course-form-modal/course-form-modal.component.html` | Modificar (solo edición) |

## Riesgos / Notas

1. **EvaluacionModalComponent** — se eliminó del template en task 3. Verificar si se usa en otro lado antes de borrar el import.
2. **CourseFormModal edit mode** — se mantiene el modal para edición desde la tabla (click en 📝). No se toca la funcionalidad de edición.
3. **Backend sin cambios** — `POST /api/cursos` ya acepta todos los campos necesarios.
4. **Reutilizar constants** — `COURSE_CATEGORIES` y `COURSE_LEVELS` ya existen en shared.

## Validación

- [ ] `npx ng build` exit 0
- [ ] `dotnet build` 0 errores
- [ ] Navegar a `/admin/course/create` → página carga con stepper
- [ ] Paso 1: completar campos → "Siguiente" habilitado
- [ ] Paso 2: completar campos → "Siguiente" habilitado
- [ ] Paso 3: subir imagen + agregar requisitos → "Crear" envía POST
- [ ] Redirect a `/admin/courses` después de crear
- [ ] Modal de edición funciona igual que antes
- [ ] Tabla no abre modal de creación (navega a página)
