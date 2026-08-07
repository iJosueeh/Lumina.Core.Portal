import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  tipo: string;
  botonTexto: string;
  botonTipo: string;
  mes: string;
  dia: string;
  esProximo: boolean;
}

export interface EventoCreateRequest {
  titulo: string;
  fecha: string;
  hora: string;
  tipo: string;
  botonTexto: string;
  botonTipo: string;
  esProximo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminEventosService {
  private http = inject(HttpClient);
  private apiUrl = environment.noticiasEventosApiUrl;

  getEventosProximos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/eventos/proximos`);
  }

  createEvento(evento: EventoCreateRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/eventos`, evento);
  }

  updateEvento(id: string, evento: EventoCreateRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/eventos/${id}`, evento);
  }

  deleteEvento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eventos/${id}`);
  }
}
