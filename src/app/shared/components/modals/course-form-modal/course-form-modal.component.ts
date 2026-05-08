import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminCourse, AdminDocente } from '@shared/models/admin-course.models';
import { NotificationService } from '@shared/services/notification.service';

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
  currentStep = signal(1);
  isSaving = signal(false);
  isEditMode = signal(false);
  
  // Requisitos dinámicos
  requisitosList = signal<string[]>([]);
  newRequisito = signal('');

  // Categorías que el dominio soporta (ver CategoriaCurso.cs)
  categories = ['Programación', 'Diseño', 'Marketing', 'Negocios', 'Desarrollo Personal'];
  levels = ['Principiante', 'Intermedio', 'Avanzado'];

  // Selected File
  selectedFile: File | null = null;
  isUploading = signal(false);

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
      ciclo: ['2024-1', [Validators.required]],
      precio: [0, [Validators.required]],
      imagenUrl: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
      estadoCurso: ['Borrador']
    });
  }

  ngOnInit(): void {
    if (this.courseToEdit) {
      this.isEditMode.set(true);
      this.courseForm.patchValue({
        nombre: this.courseToEdit.name,
        codigo: this.courseToEdit.code,
        descripcion: this.courseToEdit.description,
        instructorId: this.courseToEdit.instructorId,
        categoria: this.mapCategory(this.courseToEdit.categoria),
        nivel: this.courseToEdit.nivel || 'Principiante',
        capacidad: this.courseToEdit.capacity,
        creditos: this.courseToEdit.creditos,
        duracion: this.courseToEdit.duracion || '20h',
        ciclo: this.courseToEdit.ciclo,
        precio: this.courseToEdit.precio || 0,
        imagenUrl: this.courseToEdit.coverImage,
        estadoCurso: this.courseToEdit.status === 'PUBLISHED' ? 'Activo' : 'Borrador'
      });
      
      this.loadFullDetail();
    }
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
      } catch (err) {
        console.error('❌ Error subiendo imagen:', err);
        this.notificationService.show('error', 'No se pudo subir la imagen.');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      // Validar campos de la fase 1
      const phase1Fields = ['nombre', 'codigo', 'instructorId', 'descripcion'];
      const isValid = phase1Fields.every(field => this.courseForm.get(field)?.valid);
      
      if (isValid) {
        this.currentStep.set(2);
      } else {
        this.notificationService.show('error', 'Por favor completa los campos esenciales antes de continuar.');
        phase1Fields.forEach(f => this.courseForm.get(f)?.markAsTouched());
      }
    }
  }

  prevStep(): void {
    this.currentStep.set(1);
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

  private mapCategory(cat: any): string {
    if (!cat) return 'Programación';
    const val = typeof cat === 'string' ? cat : cat.value;
    return this.categories.includes(val) ? val : 'Programación';
  }

  private async loadFullDetail() {
    if (!this.courseToEdit?.id) return;
    try {
      const detail = await firstValueFrom(this.http.get<any>(`${environment.cursosApiUrl}/cursos/${this.courseToEdit.id}`));
      if (detail) {
        this.courseForm.patchValue({
          categoria: detail.categoriaRaw || detail.categoria?.value || detail.categoria || 'Programación',
          nivel: detail.nivelRaw || detail.nivel?.value || detail.nivel || 'Principiante',
          precio: detail.precio || 0,
          duracion: detail.duracion || '20h'
        }, { emitEvent: false });

        if (Array.isArray(detail.requisitos)) {
          this.requisitosList.set(detail.requisitos);
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudo cargar el detalle extra del curso');
    }
  }

  async submit(): Promise<void> {
    if (this.courseForm.invalid) {
        this.notificationService.show('error', 'El formulario contiene errores. Revisa todos los campos.');
        return;
    }

    this.isSaving.set(true);
    const formValue = this.courseForm.value;
    
    // EXTRAER EL GUID: Si es un objeto { value: '...' }, sacamos el string.
    let instructorIdStr = formValue.instructorId;
    if (instructorIdStr && typeof instructorIdStr === 'object' && instructorIdStr.value) {
      instructorIdStr = instructorIdStr.value;
    }

    // Mapeo a camelCase para coincidir exactamente con el DTO en el backend (.NET)
    const payload = {
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        capacidad: Number(formValue.capacidad),
        nivel: formValue.nivel,
        duracion: formValue.duracion,
        precio: Number(formValue.precio),
        imagenUrl: formValue.imagenUrl,
        categoria: formValue.categoria,
        instructorId: instructorIdStr || null,
        requisitos: this.requisitosList(),
        codigo: formValue.codigo,
        creditos: Number(formValue.creditos),
        ciclo: formValue.ciclo,
        estadoCurso: formValue.estadoCurso || 'Activo'
    };

    console.log('📡 [COURSE-FORM] Final camelCase Payload (Clean GUID):', payload);

    try {
      if (this.isEditMode() && this.courseToEdit?.id) {
        await firstValueFrom(this.http.put(`${environment.cursosApiUrl}/cursos/${this.courseToEdit.id}`, payload));
        this.notificationService.show('success', 'Curso actualizado correctamente.');
      } else {
        await firstValueFrom(this.http.post(`${environment.cursosApiUrl}/cursos`, payload));
        this.notificationService.show('success', 'Curso creado exitosamente.');
      }
      this.onSaved.emit();
      this.onClose.emit();
    } catch (err: any) {
      console.error('❌ Error guardando curso:', err);
      
      if (err.error?.errors) {
        const errorEntries = Object.entries(err.error.errors);
        console.table(err.error.errors);
        const [field, messages]: [string, any] = errorEntries[0];
        const msg = Array.isArray(messages) ? messages[0] : messages;
        this.notificationService.show('error', `Error en ${field}: ${msg}`);
      } else {
        this.notificationService.show('error', 'Error del servidor. Verifica los datos.');
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
