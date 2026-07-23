import { Component, EventEmitter, Input, Output, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div (click)="onCancel.emit()" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <i class="fas fa-trash"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-900">{{ title }}</h3>
            </div>
            <button (click)="onCancel.emit()"
              class="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <p class="text-sm text-slate-600">{{ message }}</p>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Escribe <span class="text-red-500">{{ confirmText }}</span> para confirmar
              </label>
              <input type="text"
                [ngModel]="typedText()"
                (ngModelChange)="typedText.set($event)"
                [placeholder]="confirmText"
                class="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400"
                [class.border-red-400]="typedText().length > 0 && !isValid()"
                [class.border-green-400]="isValid()"
                [class.border-slate-200]="typedText().length === 0 || isValid()">
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button (click)="onCancel.emit()"
              class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all">
              Cancelar
            </button>
            <button (click)="onConfirm.emit()" [disabled]="!isValid() || isDeleting"
              class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all flex items-center gap-2">
              @if (isDeleting) {
                <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              } @else {
                <i class="fas fa-trash text-xs"></i>
              }
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDeleteModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = 'Confirmar eliminación';
  @Input() message = 'Esta acción no se puede deshacer.';
  @Input() confirmText = '';
  @Input() isDeleting = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  typedText = signal('');
  isValid = computed(() => this.typedText() === this.confirmText);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.typedText.set('');
    }
  }
}
