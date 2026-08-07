import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AdminNoticiasService, Noticia, NoticiaCreateRequest } from '../../../infrastructure/services/admin-noticias.service';

@Component({
  selector: 'app-noticia-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './noticia-editor.html',
  styles: [`
    :host { display: block; min-height: 100vh; }
    .editor-scroll { max-height: calc(100vh - 80px); overflow-y: auto; }
  `]
})
export class NoticiaEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private noticiasService = inject(AdminNoticiasService);

  isEditing = signal(false);
  noticiaId = signal<string | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  saveSuccess = signal(false);

  // Form fields
  titulo = signal('');
  descripcion = signal('');
  contenido = signal('');
  imagenUrl = signal('');
  categoria = signal('Academico');
  badgeTexto = signal('Nuevo');
  badgeColor = signal('blue');
  autor = signal('');
  tiempoLectura = signal('');
  tagsInput = signal('');

  categorias = ['Academico', 'Tecnologia', 'Eventos', 'Noticias', 'Deportes'];
  badgeColors = [
    { label: 'Azul', value: 'blue' },
    { label: 'Verde', value: 'green' },
    { label: 'Naranja', value: 'orange' },
    { label: 'Purpura', value: 'purple' },
    { label: 'Rojo', value: 'red' },
    { label: 'Gris', value: 'gray' },
  ];

  previewHtml = computed(() => {
    const content = this.contenido();
    if (!content) return '<p class="text-slate-400 italic">Escribe contenido para ver la vista previa...</p>';
    // Simple markdown-like rendering
    return content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-slate-900 mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-slate-900 mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-black text-slate-900 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  });

  tags = computed(() => {
    const input = this.tagsInput();
    if (!input) return [];
    return input.split(',').map(t => t.trim()).filter(t => t);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditing.set(true);
      this.noticiaId.set(id);
      this.loadNoticia(id);
    }
  }

  async loadNoticia(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const noticia = await lastValueFrom(this.noticiasService.getNoticiaById(id));
      this.titulo.set(noticia.titulo);
      this.descripcion.set(noticia.descripcion);
      this.contenido.set(noticia.contenido || '');
      this.imagenUrl.set(noticia.imagenUrl);
      this.categoria.set(noticia.categoria);
      this.badgeTexto.set(noticia.badge.texto);
      this.badgeColor.set(noticia.badge.color);
      this.autor.set(noticia.autor || '');
      this.tiempoLectura.set(noticia.tiempoLectura || '');
      this.tagsInput.set(noticia.tags?.join(', ') || '');
    } catch (e) {
      console.error('Error loading noticia', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async save(): Promise<void> {
    if (!this.titulo() || !this.descripcion()) return;

    this.isSaving.set(true);
    this.saveSuccess.set(false);

    const request: NoticiaCreateRequest = {
      titulo: this.titulo(),
      descripcion: this.descripcion(),
      imagenUrl: this.imagenUrl() || 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=800',
      fecha: new Date().toISOString(),
      categoria: this.categoria(),
      badgeTexto: this.badgeTexto(),
      badgeColor: this.badgeColor(),
      autor: this.autor() || undefined,
      tiempoLectura: this.tiempoLectura() || undefined,
      contenido: this.contenido() || undefined,
      tags: this.tags().length > 0 ? this.tags() : undefined,
    };

    try {
      if (this.isEditing() && this.noticiaId()) {
        await lastValueFrom(this.noticiasService.updateNoticia(this.noticiaId()!, request));
      } else {
        await lastValueFrom(this.noticiasService.createNoticia(request));
      }
      this.saveSuccess.set(true);
      setTimeout(() => this.router.navigate(['/admin/noticias']), 1200);
    } catch (e) {
      console.error('Error saving noticia', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/noticias']);
  }
}
