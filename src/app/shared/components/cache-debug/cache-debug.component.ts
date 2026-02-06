import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CacheService } from '../../../core/services/cache.service';

/**
 * Componente de utilidad para debugging de caché
 * Solo visible en modo desarrollo
 */
@Component({
  selector: 'app-cache-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cache-debug" *ngIf="showDebug">
      <button (click)="togglePanel()" class="toggle-btn">
        🔧 Caché
      </button>
      
      <div class="debug-panel" *ngIf="panelOpen">
        <h3>Caché Debug</h3>
        
        <div class="stats">
          <div class="stat">
            <span class="label">Total:</span>
            <span class="value">{{ stats.total }}</span>
          </div>
          <div class="stat">
            <span class="label">Activas:</span>
            <span class="value">{{ stats.active }}</span>
          </div>
          <div class="stat">
            <span class="label">Expiradas:</span>
            <span class="value">{{ stats.expired }}</span>
          </div>
        </div>

        <div class="keys" *ngIf="stats.keys.length > 0">
          <h4>Claves en caché:</h4>
          <ul>
            <li *ngFor="let key of stats.keys">{{ key }}</li>
          </ul>
        </div>

        <div class="actions">
          <button (click)="refreshStats()" class="btn-secondary">
            🔄 Actualizar
          </button>
          <button (click)="cleanup()" class="btn-warning">
            🧹 Limpiar Expiradas
          </button>
          <button (click)="clearAll()" class="btn-danger">
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cache-debug {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }

    .toggle-btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .debug-panel {
      position: absolute;
      bottom: 50px;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 16px;
      min-width: 300px;
      max-width: 400px;
      max-height: 500px;
      overflow-y: auto;
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #1f2937;
    }

    h4 {
      margin: 12px 0 8px 0;
      font-size: 14px;
      color: #6b7280;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: #f3f4f6;
      border-radius: 6px;
    }

    .stat .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat .value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }

    .keys {
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .keys ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .keys li {
      padding: 6px 8px;
      margin-bottom: 4px;
      background: white;
      border-radius: 4px;
      font-size: 12px;
      color: #374151;
      word-break: break-all;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .actions button {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }
  `]
})
export class CacheDebugComponent {
  private cacheService = inject(CacheService);
  
  showDebug = true; // Cambiar a false en producción
  panelOpen = false;
  stats = { total: 0, active: 0, expired: 0, keys: [] as string[] };

  ngOnInit() {
    this.refreshStats();
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) {
      this.refreshStats();
    }
  }

  refreshStats() {
    this.stats = this.cacheService.getStats();
  }

  cleanup() {
    this.cacheService.cleanup();
    this.refreshStats();
    console.log('✅ Entradas expiradas eliminadas del caché');
  }

  clearAll() {
    if (confirm('¿Estás seguro de que deseas limpiar todo el caché?')) {
      this.cacheService.clear();
      this.refreshStats();
      console.log('🗑️ Caché completamente limpiado');
    }
  }
}
