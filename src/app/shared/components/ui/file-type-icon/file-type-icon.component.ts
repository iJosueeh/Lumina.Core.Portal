import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-type-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-type-icon.component.html',
  styleUrl: './file-type-icon.component.css'
})
export class FileTypeIconComponent {
  @Input({ required: true }) type: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get iconPath(): string {
    const icons: Record<string, string> = {
      PDF: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      Video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      Enlace: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      Presentación: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      Documento: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[this.type] ?? icons['Documento'];
  }

  get containerClass() {
    const map: Record<string, string> = {
      PDF: 'bg-red-500/10 text-red-500 border-red-500/20',
      Video: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      Enlace: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      Presentación: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      Documento: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    };
    return map[this.type] ?? map['Documento'];
  }

  get sizeClass() {
    return {
      'w-4 h-4': this.size === 'sm',
      'w-6 h-6': this.size === 'md',
      'w-8 h-8': this.size === 'lg'
    };
  }
}
