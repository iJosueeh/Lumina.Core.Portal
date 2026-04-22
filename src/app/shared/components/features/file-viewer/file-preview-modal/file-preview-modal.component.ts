import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface SharedFileResource {
  id: string;
  titulo: string;
  url: string;
  tipo?: string;
}

@Component({
  selector: 'app-file-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-preview-modal.component.html',
  styleUrl: './file-preview-modal.component.css'
})
export class FilePreviewModalComponent {
  private sanitizer = inject(DomSanitizer);

  file = input.required<SharedFileResource>();
  subtitle = input<string>('Vista previa del archivo');
  
  onClose = output<void>();
  onDownload = output<SharedFileResource>();

  safeUrl = computed<SafeResourceUrl | null>(() => {
    const f = this.file();
    return f?.url ? this.sanitizer.bypassSecurityTrustResourceUrl(f.url) : null;
  });
}
