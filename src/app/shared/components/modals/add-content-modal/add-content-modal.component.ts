import { Component, EventEmitter, Input, Output, signal, computed, inject, OnInit, OnChanges } from '@angular/core';
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
  
  selectedFile = signal<File | null>(null);
  contentType = signal<'video' | 'lectura' | 'recurso'>('video');
  sourceType = signal<'file' | 'link'>('file');

  additionalFiles = signal<AdditionalFile[]>([]);

  // Duration as separate min/sec
  duracionMinutos = signal<number>(0);
  duracionSegundos = signal<number>(0);

  /** Computed duration string "MM:SS" for the payload */
  duracionFormato = computed(() => {
    const min = this.duracionMinutos();
    const sec = this.duracionSegundos();
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  constructor() {
    this.contentForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      url: [''],
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    if (this.leccionToEdit) {
      this.isEditMode.set(true);
      const lesson = this.leccionToEdit as any;
      
      this.contentType.set(lesson.tipo || lesson.type || 'video');
      
      const hasUrl = lesson.videoUrl || lesson.url;
      this.sourceType.set(hasUrl ? 'link' : 'file');
      
      this.contentForm.patchValue({
        titulo: lesson.titulo || lesson.title || '',
        descripcion: lesson.descripcion || lesson.description || '',
        url: lesson.videoUrl || lesson.url || '',
      });

      // Parse duration "MM:SS" → min + sec
      this.parseDuration(lesson.duracion || lesson.duration || '00:00');

      const resources = lesson.resources || lesson.materiales || [];
      if (Array.isArray(resources)) {
        this.additionalFiles.set(resources.map((r: any) => ({
          name: r.title || r.name || r.titulo,
          url: r.url,
          type: r.type || r.tipo || 'pdf',
          isUploading: false,
          isExisting: true
        })));
      }
    } else {
      this.isEditMode.set(false);
      this.contentType.set('video');
      this.sourceType.set('file');
      this.duracionMinutos.set(0);
      this.duracionSegundos.set(0);
    }
  }

  /** Parse "MM:SS" or "HH:MM:SS" string into minutes and seconds signals */
  private parseDuration(raw: string): void {
    if (!raw) { this.duracionMinutos.set(0); this.duracionSegundos.set(0); return; }
    const parts = raw.split(':').map(Number);
    if (parts.length === 3) {
      // HH:MM:SS
      this.duracionMinutos.set(parts[0] * 60 + parts[1]);
      this.duracionSegundos.set(parts[2] || 0);
    } else if (parts.length === 2) {
      // MM:SS
      this.duracionMinutos.set(parts[0] || 0);
      this.duracionSegundos.set(parts[1] || 0);
    } else {
      // Just minutes
      this.duracionMinutos.set(parts[0] || 0);
      this.duracionSegundos.set(0);
    }
  }

  /** Clamp seconds to 0-59 */
  onSecondsInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.duracionSegundos.set(Math.min(59, Math.max(0, val)));
  }

  /** Clamp minutes to 0-999 */
  onMinutesInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.duracionMinutos.set(Math.min(999, Math.max(0, val)));
  }

  get showDuration(): boolean {
    return this.contentType() === 'video';
  }

  get showMultimediaSource(): boolean {
    return this.contentType() === 'video' || this.contentType() === 'recurso';
  }

  get fileAccept(): string {
    switch (this.contentType()) {
      case 'video': return 'video/mp4,video/webm';
      case 'lectura': return 'application/pdf,.txt,.md,.doc,.docx';
      case 'recurso': return '.pdf,.zip,.rar,.doc,.docx,.pptx,.xlsx';
      default: return '*';
    }
  }

  get filePlaceholder(): string {
    switch (this.contentType()) {
      case 'video': return 'Sube el video principal (MP4, WebM)';
      case 'lectura': return 'Sube el documento de lectura (PDF, DOC)';
      case 'recurso': return 'Sube el recurso descargable (PDF, ZIP)';
      default: return 'Selecciona un archivo';
    }
  }

  get fileIcon(): string {
    switch (this.contentType()) {
      case 'video': return 'fa-video';
      case 'lectura': return 'fa-file-alt';
      case 'recurso': return 'fa-archive';
      default: return 'fa-file';
    }
  }

  onTypeChange(newType: string): void {
    this.contentType.set(newType as any);
    if (newType === 'lectura') {
      this.sourceType.set('file');
      this.selectedFile.set(null);
      this.contentForm.patchValue({ url: '' });
    }
    if (this.selectedFile()) {
      this.selectedFile.set(null);
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
    
    if (!this.moduloId) {
      console.error('moduloId es requerido');
      return;
    }

    this.isSaving.set(true);

    try {
      let finalUrl = this.contentForm.value.url;
      const fileToUpload = this.selectedFile();

      if (this.showMultimediaSource && this.sourceType() === 'file' && fileToUpload) {
        finalUrl = await this.uploadToMinio(fileToUpload);
      }

      const materialesAdicionales = [];
      for (const item of this.additionalFiles()) {
        if (item.isExisting) {
          materialesAdicionales.push({ titulo: item.name, url: item.url, tipo: item.type });
          continue;
        }
        if (item.file) {
          const url = await this.uploadToMinio(item.file);
          materialesAdicionales.push({ titulo: item.name, url, tipo: item.type });
        }
      }

      const lesson = this.leccionToEdit as any;
      const lessonId = lesson?.id || lesson?.lessonId || null;
      
      const payload = {
        moduloId: this.moduloId,
        leccionId: lessonId,
        titulo: this.contentForm.value.titulo,
        tipo: this.contentType(),
        url: finalUrl || '',
        duracion: this.showDuration ? this.duracionFormato() : '',
        descripcion: this.contentForm.value.descripcion,
        materialesAdicionales
      };

      const apiUrl = `${environment.cursosApiUrl}/cursos/${this.courseId}/contenido`;
      
      if (this.isEditMode()) {
        await lastValueFrom(this.http.put(apiUrl, payload));
      } else {
        await lastValueFrom(this.http.post(apiUrl, payload));
      }
      
      this.onSaved.emit();
      this.onClose.emit();
    } catch (error) {
      console.error('Error saving content:', error);
      if (error instanceof HttpErrorResponse) {
        console.error('Detalles del error:', error.error);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private async uploadToMinio(file: File): Promise<string> {
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 100MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = `${environment.cursosApiUrl}/cursos/upload`;
    const response = await lastValueFrom(
      this.http.post<{ url: string; fileName: string }>(uploadUrl, formData)
    );
    return response.url;
  }
}
