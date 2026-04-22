import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-classroom-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-player.component.html',
  styleUrl: './classroom-player.component.css'
})
export class ClassroomPlayerComponent {
  private sanitizer = inject(DomSanitizer);

  videoUrl = input.required<string>();
  title = input<string>('');
  autoplay = input<boolean>(false);
  
  onVideoEnded = output<void>();

  safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.videoUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
