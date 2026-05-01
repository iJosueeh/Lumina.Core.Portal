import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-classroom-player',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './classroom-player.component.html',
  styleUrl: './classroom-player.component.css'
})
export class ClassroomPlayerComponent {
  private sanitizer = inject(DomSanitizer);

  videoUrl = input.required<string>();
  title = input<string>('');
  autoplay = input<boolean>(false);
  isEditable = input<boolean>(false);
  
  onVideoEnded = output<void>();
  onEditVideo = output<void>();
  onUploadVideo = output<File>();

  // Usamos un computed para forzar la reactividad completa
  videoState = computed(() => {
    const url = this.videoUrl();
    if (!url) return { safeUrl: null, trackKey: Date.now() };

    let formattedUrl = url;
    const youtubeId = this.extractYoutubeId(url);
    
    if (youtubeId) {
       formattedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=${this.autoplay() ? 1 : 0}&rel=0&modestbranding=1`;
    }

    return {
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(formattedUrl),
      trackKey: url // Usamos la propia URL como llave para forzar re-render si cambia
    };
  });

  private extractYoutubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  handleFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) this.onUploadVideo.emit(file);
  }
}
