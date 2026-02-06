import { Injectable } from '@angular/core';

/**
 * Servicio de caché en memoria para optimizar llamadas a APIs
 * Evita peticiones duplicadas y reduce latencia
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Obtiene un valor del caché si existe y no ha expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si el caché ha expirado
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Almacena un valor en el caché con un tiempo de expiración
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    };
    this.cache.set(key, entry);
  }

  /**
   * Invalida (elimina) una entrada específica del caché
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    Array.from(this.cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Verifica si existe una entrada en el caché y no ha expirado
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    this.cache.forEach((entry) => {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    });

    return {
      total: this.cache.size,
      active,
      expired,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Limpia entradas expiradas (garbage collection)
   */
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries())
      .filter(([_, entry]) => now > entry.expiresAt)
      .forEach(([key, _]) => this.cache.delete(key));
  }
}

interface CacheEntry {
  data: any;
  expiresAt: number;
  createdAt: number;
}
