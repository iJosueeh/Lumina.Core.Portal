import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Leccion } from '@shared/models/course-management.models';

interface AdditionalFile {
  file: File;
  name: string;
  type: string;
  isUploading: boolean;
  url?: string;
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
      this.contentType.set(this.leccionToEdit.tipo as any || 'video');
      this.sourceType.set(this.leccionToEdit.videoUrl ? 'link' : 'file');
      
      this.contentForm.patchValue({
        titulo: this.leccionToEdit.titulo,
        descripcion: this.leccionToEdit.descripcion || '',
        url: this.leccionToEdit.videoUrl || '',
        duracion: this.leccionToEdit.duracion || '15:00',
      });
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

  async submit(): Promise<void> {
    if (this.contentForm.invalid) return;
    this.isSaving.set(true);

    try {
      // 1. Subir Contenido Principal si es archivo
      let finalUrl = this.contentForm.value.url;
      if (this.sourceType() === 'file' && this.selectedFile) {
        finalUrl = await this.uploadToMinio(this.selectedFile);
      }

      // 2. Subir Recursos Adicionales
      const materialesAdicionales = [];
      for (const item of this.additionalFiles()) {
        const url = await this.uploadToMinio(item.file);
        materialesAdicionales.push({
          titulo: item.name,
          url: url,
          tipo: item.type
        });
      }

      const payload = {
        moduloId: this.moduloId,
        leccionId: this.leccionToEdit?.id,
        titulo: this.contentForm.value.titulo,
        tipo: this.contentType(),
        url: finalUrl,
        duracion: this.contentForm.value.duracion,
        descripcion: this.contentForm.value.descripcion,
        materialesAdicionales
      };

      const url = `${environment.cursosApiUrl}/cursos/${this.courseId}/contenido`;
      if (this.isEditMode()) {
        await this.http.put(url, payload).toPromise();
      } else {
        await this.http.post(url, payload).toPromise();
      }
      
      this.onSaved.emit();
      this.onClose.emit();
    } catch (error) {
      console.error('❌ [CONTENT-MODAL] Error saving content:', error);
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
