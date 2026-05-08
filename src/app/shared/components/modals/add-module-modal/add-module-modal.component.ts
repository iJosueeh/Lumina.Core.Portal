import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="handleClose()"></div>
        
        <div class="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div class="p-10 space-y-8 relative">
                <!-- Header -->
                <div class="flex justify-between items-center relative z-10">
                    <div>
                        <h2 class="text-2xl font-black text-white tracking-tight">
                            {{ isEditMode() ? 'Configurar Sección' : 'Nueva Sección' }}
                        </h2>
                        <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {{ isEditMode() ? 'Modifica o elimina esta sección del curso' : 'Define el título y objetivo del nuevo módulo' }}
                        </p>
                    </div>
                    <button (click)="handleClose()" [disabled]="isSaving()" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all disabled:opacity-30">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form [formGroup]="moduleForm" (ngSubmit)="submit()" class="space-y-6 relative z-10">
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título del Módulo</label>
                            <input type="text" formControlName="titulo" placeholder="Ej: Fundamentos de..." 
                                class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold">
                        </div>

                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción corta</label>
                            <textarea formControlName="descripcion" rows="3" placeholder="¿Qué aprenderán en este módulo?..."
                                class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none text-sm leading-relaxed"></textarea>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 pt-4">
                        <div class="flex gap-4">
                            <button type="button" (click)="handleClose()" [disabled]="isSaving()" class="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] disabled:opacity-30">
                                Cancelar
                            </button>
                            <button type="submit" [disabled]="moduleForm.invalid || isSaving()" 
                                class="flex-[2] py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
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
                                class="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2 mt-2">
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
