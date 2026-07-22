import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" (click)="cancel()"></div>
        <div class="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-900 tracking-tight">{{ title() }}</h3>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Esta acción es irreversible</p>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">{{ message() }}</p>
          </div>
          <div class="px-6 pb-4">
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Escribe <span class="text-red-500 font-black">{{ confirmText() }}</span> para confirmar
            </label>
            <input
              type="text"
              [(ngModel)]="userInput"
              [placeholder]="confirmText()"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-300 transition-all placeholder:text-slate-300">
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <button (click)="cancel()"
              class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-all border border-slate-200">
              Cancelar
            </button>
            <button (click)="confirm()"
              [disabled]="!canConfirm()"
              class="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl transition-all shadow-sm">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDeleteModalComponent {
  isOpen = input.required<boolean>();
  title = input<string>('Eliminar');
  message = input<string>('¿Estás seguro?');
  confirmText = input.required<string>();

  onConfirm = output<void>();
  onCancel = output<void>();

  userInput = '';

  canConfirm = computed(() => this.userInput.trim() === this.confirmText());

  confirm(): void {
    this.userInput = '';
    this.onConfirm.emit();
  }

  cancel(): void {
    this.userInput = '';
    this.onCancel.emit();
  }
}
