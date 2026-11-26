import { Injectable } from '@angular/core';

export interface CookieOptions {
  expires?: Date | number; // Date o segundos hasta la expiración
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
   * Obtiene el valor de una cookie por su nombre.
   */
  get(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }

    return null;
  }

  /**
   * Guarda una cookie con opciones de expiración, path y seguridad.
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') {
      return;
    }

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    const path = options.path ?? '/';
    cookieString += `; path=${path}`;

    if (options.expires) {
      let expiresDate: Date;
      if (typeof options.expires === 'number') {
        expiresDate = new Date();
        expiresDate.setTime(expiresDate.getTime() + options.expires * 1000);
      } else {
        expiresDate = options.expires;
      }
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure || (typeof location !== 'undefined' && location.protocol === 'https:')) {
      cookieString += '; secure';
    }

    const sameSite = options.sameSite ?? 'Lax';
    cookieString += `; samesite=${sameSite}`;

    document.cookie = cookieString;
  }

  /**
   * Elimina una cookie por su nombre y path.
   */
  delete(name: string, path: string = '/'): void {
    if (typeof document === 'undefined') {
      return;
    }
    // Expira la cookie inmediatamente en el pasado
    document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=Lax`;
  }

  /**
   * Comprueba si una cookie existe.
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  }
}
