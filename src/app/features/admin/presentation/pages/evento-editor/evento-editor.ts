import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminEventosService, EventoCreateRequest } from '../../../infrastructure/services/admin-eventos.service';

@Component({
  selector: 'app-evento-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evento-editor.html',
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class EventoEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventosService = inject(AdminEventosService);

  isEditing = signal(false);
  eventoId = signal<string | null>(null);
  isSaving = signal(false);
  saveSuccess = signal(false);

  titulo = signal('');
  fecha = signal('');
  hora = signal('');
  tipo = signal('Online');
  botonTexto = signal('Registrarse');
  botonTipo = signal('primary');
  esProximo = signal(true);

  tipos = ['Online', 'Presencial', 'Hibrido'];
  botonTipos = [
    { label: 'Primario', value: 'primary' },
    { label: 'Secundario', value: 'secondary' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditing.set(true);
      this.eventoId.set(id);
    }
  }

  async save(): Promise<void> {
    if (!this.titulo() || !this.fecha()) return;
    this.isSaving.set(true);

    const request: EventoCreateRequest = {
      titulo: this.titulo(),
      fecha: new Date(this.fecha()).toISOString(),
      hora: this.hora() || '00:00',
      tipo: this.tipo(),
      botonTexto: this.botonTexto(),
      botonTipo: this.botonTipo(),
      esProximo: this.esProximo(),
    };

    try {
      if (this.isEditing() && this.eventoId()) {
        await this.eventosService.updateEvento(this.eventoId()!, request).toPromise();
      } else {
        await this.eventosService.createEvento(request).toPromise();
      }
      this.saveSuccess.set(true);
      setTimeout(() => this.router.navigate(['/admin/eventos']), 1200);
    } catch (e) {
      console.error('Error saving evento', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/eventos']);
  }

  getPreviewDate(): string {
    const f = this.fecha();
    if (!f) return '--';
    const d = new Date(f);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getPreviewMes(): string {
    const f = this.fecha();
    if (!f) return 'MES';
    return new Date(f).toLocaleDateString('es-PE', { month: 'short' }).toUpperCase();
  }

  getPreviewDia(): string {
    const f = this.fecha();
    if (!f) return '--';
    return new Date(f).getDate().toString().padStart(2, '0');
  }
}
