import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Noticia {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  fecha: string;
  categoria: string;
  badge: { texto: string; color: string };
  autor: string | null;
  autorAvatar: string | null;
  tiempoLectura: string | null;
  contenido: string | null;
  tags: string[];
}

export interface NoticiaCreateRequest {
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  fecha: string;
  categoria: string;
  badgeTexto: string;
  badgeColor: string;
  autor?: string;
  autorAvatar?: string;
  tiempoLectura?: string;
  contenido?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminNoticiasService {
  private http = inject(HttpClient);
  private apiUrl = environment.noticiasEventosApiUrl;

  getNoticias(page = 1, pageSize = 10, categoria?: string, search?: string): Observable<Noticia[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (categoria) params = params.set('categoria', categoria);
    if (search) params = params.set('search', search);

    return this.http.get<Noticia[]>(`${this.apiUrl}/noticias`, { params });
  }

  getNoticiaById(id: string): Observable<Noticia> {
    return this.http.get<Noticia>(`${this.apiUrl}/noticias/${id}`);
  }

  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/noticias/categorias`);
  }

  createNoticia(noticia: NoticiaCreateRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/noticias`, noticia);
  }

  updateNoticia(id: string, noticia: NoticiaCreateRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/noticias/${id}`, noticia);
  }

  deleteNoticia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/noticias/${id}`);
  }
}
