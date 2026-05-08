import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
export class AddContentModalComponent implements OnInit {
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
  selectedFile: File | null = null;
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
    if (this.leccionToEdit) {
      this.isEditMode.set(true);
      const lesson = this.leccionToEdit as any;
      
      this.contentType.set(lesson.tipo || 'video');
      this.sourceType.set(lesson.videoUrl || lesson.url ? 'link' : 'file');
      
      this.contentForm.patchValue({
        titulo: lesson.titulo || lesson.title,
        descripcion: lesson.descripcion || lesson.description || '',
        url: lesson.videoUrl || lesson.url || '',
        duracion: lesson.duracion || lesson.duration || '15:00',
      });

      // Cargar recursos existentes
      if (lesson.resources && Array.isArray(lesson.resources)) {
        const existingResources = lesson.resources.map((r: any) => ({
          name: r.title || r.name,
          url: r.url,
          type: r.type,
          isUploading: false,
          isExisting: true
        }));
        this.additionalFiles.set(existingResources);
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
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
    
    this.isSaving.set(true);

    try {
      // 1. Subir Contenido Principal
      let finalUrl = this.contentForm.value.url;
      if (this.sourceType() === 'file' && this.selectedFile) {
        finalUrl = await this.uploadToMinio(this.selectedFile);
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
      const lessonId = lesson?.id || lesson?.lessonId;
      
      const payload = {
        moduloId: this.moduloId,
        leccionId: lessonId,
        titulo: this.contentForm.value.titulo,
        tipo: this.contentType(),
        url: finalUrl,
        duracion: this.contentForm.value.duracion,
        descripcion: this.contentForm.value.descripcion,
        materialesAdicionales
      };

      const apiUrl = `${environment.cursosApiUrl}/cursos/${this.courseId}/contenido`;
      
      if (this.isEditMode()) {
        await this.http.put(apiUrl, payload).toPromise();
      } else {
        await this.http.post(apiUrl, payload).toPromise();
      }
      
      this.onSaved.emit();
      this.onClose.emit();
    } catch (error) {
      console.error('❌ Error saving content:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async uploadToMinio(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.http.post<any>(`${environment.cursosApiUrl}/cursos/upload`, formData).toPromise();
    return response.url;
  }
}
