import { Component, EventEmitter, Input, Output, signal, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { Leccion } from '@shared/models/course-management.models';

interface AdditionalFile {
  file?: File;
  name: string;
  type: string;
  isUploading: boolean;
  url?: string;
  isExisting?: boolean;
}

@Component({
  selector: 'app-add-content-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-content-modal.component.html',
})
export class AddContentModalComponent implements OnInit, OnChanges {
  @Input({ required: true }) courseId!: string;
  @Input({ required: true }) moduloId!: string;
  @Input() leccionToEdit: Leccion | null = null;
  @Input() mode: 'full' | 'materials' = 'full';
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  contentForm: FormGroup;
  isSaving = signal(false);
  isEditMode = signal(false);
  
  // Multimedia Principal
  selectedFile = signal<File | null>(null);
  contentType = signal<'video' | 'lectura' | 'recurso'>('video');
  sourceType = signal<'file' | 'link'>('file');

  // Recursos Adicionales
  additionalFiles = signal<AdditionalFile[]>([]);

  constructor() {
    this.contentForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      url: [''],
      duracion: ['15:00'],
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  // Usamos ngOnChanges para asegurar que si los inputs cambian (por ejemplo leccionToEdit), el componente reaccione
  ngOnChanges(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    if (this.leccionToEdit) {
      console.log('📝 [AddContentModal] Inicializando en modo edición:', this.leccionToEdit);
      this.isEditMode.set(true);
      const lesson = this.leccionToEdit as any;
      
      this.contentType.set(lesson.tipo || lesson.type || 'video');
      
      const hasUrl = lesson.videoUrl || lesson.url;
      this.sourceType.set(hasUrl ? 'link' : 'file');
      
      this.contentForm.patchValue({
        titulo: lesson.titulo || lesson.title || '',
        descripcion: lesson.descripcion || lesson.description || '',
        url: lesson.videoUrl || lesson.url || '',
        duracion: lesson.duracion || lesson.duration || '15:00',
      });

      // Cargar recursos existentes
      const resources = lesson.resources || lesson.materiales || [];
      if (Array.isArray(resources)) {
        const existingResources = resources.map((r: any) => ({
          name: r.title || r.name || r.titulo,
          url: r.url,
          type: r.type || r.tipo || 'pdf',
          isUploading: false,
          isExisting: true
        }));
        this.additionalFiles.set(existingResources);
      }
    } else {
      this.isEditMode.set(false);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      if (!this.isEditMode()) {
        this.contentForm.patchValue({ titulo: file.name.split('.')[0] });
      }
    }
  }

  onAdditionalFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.additionalFiles.update(prev => [...prev, {
        file,
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'zip',
        isUploading: false
      }]);
    }
  }

  removeAdditionalFile(index: number): void {
    this.additionalFiles.update(prev => prev.filter((_, i) => i !== index));
  }

  handleClose(): void {
    if (!this.isSaving()) {
      this.onClose.emit();
    }
  }

  async submit(): Promise<void> {
    if (this.contentForm.invalid) return;
    
    // Validar ModuloId
    if (!this.moduloId) {
      console.error('❌ Error: moduloId es requerido');
      return;
    }

    this.isSaving.set(true);

    try {
      // 1. Subir Contenido Principal
      let finalUrl = this.contentForm.value.url;
      const fileToUpload = this.selectedFile();
      if (this.sourceType() === 'file' && fileToUpload) {
        finalUrl = await this.uploadToMinio(fileToUpload);
      }

      // 2. Subir Recursos Adicionales
      const materialesAdicionales = [];
      for (const item of this.additionalFiles()) {
        if (item.isExisting) {
          materialesAdicionales.push({ titulo: item.name, url: item.url, tipo: item.type });
          continue;
        }
        if (item.file) {
          const url = await this.uploadToMinio(item.file);
          materialesAdicionales.push({ titulo: item.name, url: url, tipo: item.type });
        }
      }

      const lesson = this.leccionToEdit as any;
      const lessonId = lesson?.id || lesson?.lessonId || null;
      
      // Construir payload exacto como lo espera el backend (AddContentRequest)
      const payload = {
        moduloId: this.moduloId,
        leccionId: lessonId,
        titulo: this.contentForm.value.titulo,
        tipo: this.contentType(),
        url: finalUrl,
        duracion: this.contentForm.value.duracion,
        descripcion: this.contentForm.value.descripcion,
        materialesAdicionales: materialesAdicionales
      };

      console.log('🚀 [AddContentModal] Enviando payload:', {
        method: this.isEditMode() ? 'PUT' : 'POST',
        apiUrl: `${environment.cursosApiUrl}/cursos/${this.courseId}/contenido`,
        payload
      });

      const apiUrl = `${environment.cursosApiUrl}/cursos/${this.courseId}/contenido`;
      
      if (this.isEditMode()) {
        await lastValueFrom(this.http.put(apiUrl, payload));
      } else {
        await lastValueFrom(this.http.post(apiUrl, payload));
      }
      
      this.onSaved.emit();
      this.onClose.emit();
    } catch (error) {
      console.error('❌ Error saving content:', error);
      if (error instanceof HttpErrorResponse) {
        console.error('Detalles del error:', error.error);
      }
    } finally {
      this.isSaving.set(false);
    }
  }


  private async uploadToMinio(file: File): Promise<string> {
    // Validar tamaño del archivo (máximo 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 100MB');
    }

    // Validar tipo MIME
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/avi', 'video/quicktime',
      'application/pdf', 'application/zip',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}`);
    }

    const formData = new FormData();
    formData.append('file', file);

    // URL correcta: cursosApiUrl = 'http://localhost:5100/cursos/api'
    // Endpoint real: POST /api/cursos/upload -> /cursos/api/upload
    const uploadUrl = `${environment.cursosApiUrl}/upload`;

    const response = await lastValueFrom(
      this.http.post<{ url: string; fileName: string }>(uploadUrl, formData)
    );
    return response.url;
  }
}
