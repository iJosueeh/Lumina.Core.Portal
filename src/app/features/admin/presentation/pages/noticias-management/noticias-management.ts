import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminNoticiasService, Noticia } from '../../../infrastructure/services/admin-noticias.service';
import { ConfirmDeleteModalComponent } from '@shared/components/ui/confirm-delete-modal/confirm-delete-modal.component';
import { PaginationComponent } from '@shared/components/ui/pagination/pagination.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-noticias-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDeleteModalComponent, PaginationComponent, SkeletonLoaderComponent],
  templateUrl: './noticias-management.html',
  styles: [`
    :host { display: block; min-height: 100vh; }
  `]
})
export class NoticiasManagement implements OnInit {
  private noticiasService = inject(AdminNoticiasService);
  private router = inject(Router);

  allNoticias = signal<Noticia[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedCategoria = signal('Todas');
  currentPage = signal(1);
  itemsPerPage = 8;

  showDeleteModal = signal(false);
  noticiaToDelete = signal<Noticia | null>(null);

  categorias = ['Todas', 'Academico', 'Tecnologia', 'Eventos', 'Noticias', 'Deportes'];

  deleteMessage = computed(() => {
    const title = this.noticiaToDelete()?.titulo || '';
    return title
      ? `¿Estás seguro de eliminar la noticia "${title}"? Esta acción es irreversible.`
      : '¿Estás seguro de eliminar esta noticia?';
  });

  filteredNoticias = computed(() => {
    let temp = [...this.allNoticias()];
    const term = this.searchTerm().toLowerCase();
    const cat = this.selectedCategoria();

    if (term) {
      temp = temp.filter(n =>
        n.titulo.toLowerCase().includes(term) ||
        n.descripcion.toLowerCase().includes(term) ||
        n.categoria.toLowerCase().includes(term)
      );
    }

    if (cat !== 'Todas') {
      temp = temp.filter(n => n.categoria === cat);
    }

    return temp;
  });

  paginatedNoticias = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredNoticias().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => Math.ceil(this.filteredNoticias().length / this.itemsPerPage));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.noticiasService.getNoticias(1, 100).subscribe({
      next: (data) => {
        this.allNoticias.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onCategoriaChange(categoria: string): void {
    this.selectedCategoria.set(categoria);
    this.currentPage.set(1);
  }

  openCreate(): void {
    this.router.navigate(['/admin/noticias/new']);
  }

  openEdit(noticia: Noticia): void {
    this.router.navigate(['/admin/noticias/edit', noticia.id]);
  }

  confirmDelete(noticia: Noticia): void {
    this.noticiaToDelete.set(noticia);
    this.showDeleteModal.set(true);
  }

  deleteNoticia(): void {
    const noticia = this.noticiaToDelete();
    if (!noticia) return;

    this.noticiasService.deleteNoticia(noticia.id).subscribe({
      next: () => {
        this.allNoticias.update(n => n.filter(x => x.id !== noticia.id));
        this.showDeleteModal.set(false);
        this.noticiaToDelete.set(null);
      },
      error: () => this.showDeleteModal.set(false)
    });
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.noticiaToDelete.set(null);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getBadgeColor(color: string): string {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-slate-100 text-slate-600',
    };
    return colors[color] || 'bg-slate-100 text-slate-600';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
