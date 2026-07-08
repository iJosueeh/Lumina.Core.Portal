import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Announcement } from '@features/student/domain/models/announcement.model';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-recent-announcements',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  templateUrl: './recent-announcements.component.html',
  styleUrl: './recent-announcements.component.css'
})
export class RecentAnnouncementsComponent {
  @Input({ required: true }) announcements: Announcement[] = [];
  @Input() isLoading = false;
  @Input() limit = 3;
  @Output() viewAll = new EventEmitter<void>();

  getIcon(iconName: string): string {
    const icons: Record<string, string> = {
      'settings': 'fas fa-cog',
      'school': 'fas fa-graduation-cap',
      'campaign': 'fas fa-bullhorn'
    };
    return icons[iconName] || 'fas fa-bullhorn';
  }

  getIconColor(tipo: string): string {
    const colors: Record<string, string> = {
      'SISTEMA': 'text-cyan-400',
      'CURSO': 'text-blue-400',
      'GENERAL': 'text-amber-400'
    };
    return colors[tipo] || 'text-amber-400';
  }

  getIconBg(tipo: string): string {
    const backgrounds: Record<string, string> = {
      'SISTEMA': 'bg-cyan-500/10',
      'CURSO': 'bg-blue-500/10',
      'GENERAL': 'bg-amber-500/10'
    };
    return backgrounds[tipo] || 'bg-amber-500/10';
  }

  getBadgeColor(tipo: string): string {
    const colors: Record<string, string> = {
      'SISTEMA': 'bg-cyan-500/20 text-cyan-400',
      'CURSO': 'bg-blue-500/20 text-blue-400',
      'GENERAL': 'bg-amber-500/20 text-amber-400'
    };
    return colors[tipo] || 'bg-amber-500/20 text-amber-400';
  }

  onViewAll(): void {
    this.viewAll.emit();
  }
}
