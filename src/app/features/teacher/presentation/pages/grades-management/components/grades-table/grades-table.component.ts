import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-grades-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grades-table.component.html',
  styleUrl: './grades-table.component.css'
})
export class GradesTableComponent {
  @Input({ required: true }) evaluaciones: any[] = [];
  @Input({ required: true }) evaluacionIds: string[] = [];
  @Input({ required: true }) calificaciones: any[] = [];
  @Input() isLoading = false;
  @Input() pageSize = 5;

  @Output() gradeChange = new EventEmitter<{ estudianteId: string; evaluacionId: string; nota: number | null }>();

  currentPage = signal(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.calificaciones.length / this.pageSize)));

  paginatedCalificaciones = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.calificaciones.slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  });

  expandedStudents = new Set<string>();

  toggleStudent(estudianteId: string) {
    if (this.expandedStudents.has(estudianteId)) {
      this.expandedStudents.delete(estudianteId);
    } else {
      this.expandedStudents.add(estudianteId);
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.expandedStudents.clear();
  }

  prevPage() { this.goToPage(this.currentPage() - 1); }
  nextPage() { this.goToPage(this.currentPage() + 1); }

  onNotaChange(estudianteId: string, evaluacionId: string, value: number | null) {
    this.gradeChange.emit({ estudianteId, evaluacionId, nota: value });
  }

  /** Clamp value to 0–20 range (Peru vigesimal scale) */
  clamp(value: number | null): number | null {
    if (value == null || isNaN(value)) return null;
    return Math.min(20, Math.max(0, value));
  }

  mathMin = Math.min;
}
