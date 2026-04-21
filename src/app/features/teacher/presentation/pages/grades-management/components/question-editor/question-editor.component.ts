import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PreguntaForm } from '@shared/models/grades-management.models';

@Component({
  selector: 'app-grades-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.css'
})
export class GradesQuestionEditorComponent implements OnInit {
  private fb = inject(FormBuilder);

  preguntas = signal<PreguntaForm[]>([]);
  showForm = signal(false);
  editingIdx: number | null = null;
  questionForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.questionForm = this.fb.group({
      tipoPregunta: [1, Validators.required],
      texto: ['', Validators.required],
      puntos: [1, [Validators.required, Validators.min(1)]],
      orden: [1, Validators.required],
      respuestaCorrecta: [''],
      explicacion: [''],
      imagenUrl: ['']
    });
  }

  openAddForm(): void {
    this.editingIdx = null;
    this.questionForm.reset({ tipoPregunta: 1, puntos: 1, orden: this.preguntas().length + 1 });
    this.showForm.set(true);
  }

  editQuestion(idx: number): void {
    this.editingIdx = idx;
    const p = this.preguntas()[idx];
    this.questionForm.patchValue(p);
    this.showForm.set(true);
  }

  deleteQuestion(idx: number): void {
    const current = [...this.preguntas()];
    current.splice(idx, 1);
    this.preguntas.set(current);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  onTipoChange(): void {
    // Lógica para ajustar el formulario según el tipo (opciones, etc)
  }

  save(): void {
    if (this.questionForm.invalid) return;

    const current = [...this.preguntas()];
    if (this.editingIdx !== null) {
      current[this.editingIdx] = { ...this.questionForm.value };
    } else {
      current.push({ ...this.questionForm.value, opciones: [] });
    }
    this.preguntas.set(current);
    this.closeForm();
  }

  getTipoLabel(tipo: number): string {
    const labels: Record<number, string> = { 1: 'Opción Múltiple', 2: 'Verdadero/Falso', 3: 'Respuesta Corta' };
    return labels[tipo] || 'Otro';
  }
}
