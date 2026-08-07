import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminEventosService, Evento } from '../../../infrastructure/services/admin-eventos.service';
import { ConfirmDeleteModalComponent } from '@shared/components/ui/confirm-delete-modal/confirm-delete-modal.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-eventos-management',
  standalone: true,
  imports: [CommonModule, ConfirmDeleteModalComponent, SkeletonLoaderComponent],
  templateUrl: './eventos-management.html',
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class EventosManagement implements OnInit {
  private eventosService = inject(AdminEventosService);
  private router = inject(Router);

  allEventos = signal<Evento[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  showDeleteModal = signal(false);
  eventoToDelete = signal<Evento | null>(null);

  filteredEventos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allEventos();
    return this.allEventos().filter(e =>
      e.titulo.toLowerCase().includes(term) ||
      e.tipo.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.eventosService.getEventosProximos().subscribe({
      next: (data) => { this.allEventos.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  openCreate(): void {
    this.router.navigate(['/admin/eventos/new']);
  }

  openEdit(evento: Evento): void {
    this.router.navigate(['/admin/eventos/edit', evento.id]);
  }

  confirmDelete(evento: Evento): void {
    this.eventoToDelete.set(evento);
    this.showDeleteModal.set(true);
  }

  deleteEvento(): void {
    const evento = this.eventoToDelete();
    if (!evento) return;
    this.eventosService.deleteEvento(evento.id).subscribe({
      next: () => {
        this.allEventos.update(e => e.filter(x => x.id !== evento.id));
        this.showDeleteModal.set(false);
        this.eventoToDelete.set(null);
      },
      error: () => this.showDeleteModal.set(false)
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.eventoToDelete.set(null);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  deleteMessage = computed(() => {
    const title = this.eventoToDelete()?.titulo || '';
    return title ? `¿Eliminar evento "${title}"?` : '¿Eliminar este evento?';
  });
}
