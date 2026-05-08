import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface ClassroomResource {
  id: string;
  title: string;
  type: string;
  url: string;
}

@Component({
  selector: 'app-classroom-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-resources.component.html',
  styleUrl: './classroom-resources.component.css'
})
export class ClassroomResourcesComponent {
  resources = input.required<ClassroomResource[]>();
  scope = input<'lesson' | 'section' | 'course'>('lesson');
  
  onDownload = output<ClassroomResource>();
  onOpen = output<ClassroomResource>();
  onScopeChange = output<'lesson' | 'section' | 'course'>();

  private sanitizer = inject(DomSanitizer);
  previewUrl = signal<SafeResourceUrl | null>(null);
  selectedResource = signal<ClassroomResource | null>(null);

  getResourceIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    if (t.includes('zip') || t.includes('rar')) return 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4';
    return 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.103 1.103';
  }

  isDownloadable(type: string): boolean {
    const t = type.toLowerCase();
    return t.includes('pdf') || t.includes('zip') || t.includes('rar');
  }

  openPreview(resource: ClassroomResource): void {
    if (resource.type.toLowerCase().includes('pdf')) {
      this.selectedResource.set(resource);
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(resource.url));
    } else {
      window.open(resource.url, '_blank');
    }
  }

  closePreview(): void {
    this.previewUrl.set(null);
    this.selectedResource.set(null);
  }

  downloadResource(resource: ClassroomResource): void {
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.onDownload.emit(resource);
  }
}
