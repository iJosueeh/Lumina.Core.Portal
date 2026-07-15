import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="handleClose()"></div>

        <div class="relative bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div class="p-8 space-y-6">

                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-xl font-bold text-slate-900">
                            {{ isEditMode() ? 'Configurar Sección' : 'Nueva Sección' }}
                        </h2>
                        <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                            {{ isEditMode() ? 'Modifica o elimina esta sección' : 'Define el título y objetivo del módulo' }}
                        </p>
                    </div>
                    <button (click)="handleClose()" [disabled]="isSaving()"
                        class="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all disabled:opacity-30">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form [formGroup]="moduleForm" (ngSubmit)="submit()" class="space-y-5">
                    <div class="space-y-4">
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Título del Módulo</label>
                            <input type="text" formControlName="titulo" placeholder="Ej: Fundamentos de..."
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm font-medium placeholder:text-slate-300">
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descripción corta</label>
                            <textarea formControlName="descripcion" rows="2" placeholder="¿Qué aprenderán en este módulo?"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none text-sm leading-relaxed placeholder:text-slate-300"></textarea>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div class="flex gap-3">
                            <button type="button" (click)="handleClose()" [disabled]="isSaving()"
                                class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all text-sm disabled:opacity-30">
                                Cancelar
                            </button>
                            <button type="submit" [disabled]="moduleForm.invalid || isSaving()"
                                class="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-semibold rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                                @if (isSaving()) {
                                    <i class="fas fa-spinner fa-spin"></i>
                                    Procesando...
                                } @else {
                                    {{ isEditMode() ? 'Actualizar Módulo' : 'Crear Módulo' }}
                                }
                            </button>
                        </div>

                        @if (isEditMode()) {
                            <button type="button" (click)="confirmDelete()" [disabled]="isSaving()"
                                class="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-2">
                                <i class="fas fa-trash-alt"></i> Eliminar Módulo Definitivamente
                            </button>
                        }
                    </div>
                </form>
            </div>
        </div>
    </div>
  `
})
export class AddModuleModalComponent implements OnInit {
  @Input() moduleToEdit: {id: string, titulo: string, descripcion: string} | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onCreated = new EventEmitter<{titulo: string, descripcion: string}>();
  @Output() onUpdate = new EventEmitter<{id: string, titulo: string, descripcion: string}>();
  @Output() onDelete = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  
  moduleForm: FormGroup;
  isSaving = signal(false);
  isEditMode = signal(false);

  constructor() {
    this.moduleForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['Módulo de contenido del curso.'],
    });
  }

  ngOnInit(): void {
    if (this.moduleToEdit) {
      this.isEditMode.set(true);
      this.moduleForm.patchValue({
        titulo: this.moduleToEdit.titulo,
        descripcion: this.moduleToEdit.descripcion
      });
    }
  }

  handleClose(): void {
    if (!this.isSaving()) {
      this.onClose.emit();
    }
  }

  submit(): void {
    if (this.moduleForm.valid) {
      this.isSaving.set(true);
      if (this.isEditMode() && this.moduleToEdit) {
        this.onUpdate.emit({
          id: this.moduleToEdit.id,
          ...this.moduleForm.value
        });
      } else {
        this.onCreated.emit(this.moduleForm.value);
      }
    }
  }

  confirmDelete(): void {
    if (this.moduleToEdit && confirm(`¿Estás seguro de eliminar el módulo "${this.moduleToEdit.titulo}"? Esta acción no se puede deshacer.`)) {
      this.isSaving.set(true);
      this.onDelete.emit(this.moduleToEdit.id);
    }
  }
}
