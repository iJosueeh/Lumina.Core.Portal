import { Injectable } from '@angular/core';

export interface CookieOptions {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Obtiene el valor de una cookie por su nombre
   * @param name Nombre de la cookie
   * @returns El valor de la cookie o null si no existe
   */
  get(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    
    return null;
  }

  /**
   * Establece una cookie
   * @param name Nombre de la cookie
   * @param value Valor de la cookie
   * @param options Opciones adicionales para la cookie
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (options.expires) {
      if (typeof options.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${date.toUTCString()}`;
      } else {
        cookieString += `; expires=${options.expires.toUTCString()}`;
      }
    }

    cookieString += `; path=${options.path || '/'}`;

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += '; secure';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    document.cookie = cookieString;
    console.log('🍪 [COOKIE SERVICE] Cookie establecida:', name);
  }

  /**
   * Elimina una cookie
   * @param name Nombre de la cookie
   * @param path Path de la cookie (debe coincidir con el usado al crear la cookie)
   */
  delete(name: string, path: string = '/'): void {
    this.set(name, '', {
      expires: new Date(0),
      path: path
    });
    console.log('🗑️ [COOKIE SERVICE] Cookie eliminada:', name);
  }

  /**
   * Verifica si existe una cookie
   * @param name Nombre de la cookie
   * @returns true si la cookie existe, false en caso contrario
   */
  exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Elimina todas las cookies
   */
  deleteAll(path: string = '/'): void {
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      this.delete(name, path);
    }
    
    console.log('🗑️ [COOKIE SERVICE] Todas las cookies eliminadas');
  }
}
