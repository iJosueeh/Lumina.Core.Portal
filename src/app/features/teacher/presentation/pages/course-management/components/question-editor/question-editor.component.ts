import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { QuestionDraft } from '@shared/models/course-management.models';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-editor.component.html',
  styleUrl: './question-editor.component.css'
})
export class QuestionEditorComponent implements OnInit {
  @Input({ required: true }) quizzId!: string;
  @Input({ required: true }) quizzTitle!: string;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  questionsList: QuestionDraft[] = [];
  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit(): void {
    if (this.quizzId) {
      this.loadExistingQuestions(this.quizzId);
    }
  }

  private async loadExistingQuestions(evaluacionId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`)
      );

      const preguntas = response?.preguntas ?? response?.Preguntas ?? [];
      if (!Array.isArray(preguntas) || preguntas.length === 0) {
        this.questionsList = [this.createEmptyQuestion()];
        return;
      }

      this.questionsList = preguntas.map((p: any) => ({
        id: p.id ?? p.Id,
        esExistente: true,
        texto: p.texto ?? p.Texto ?? p.enunciado ?? p.Enunciado ?? '',
        puntos: Number(p.puntos ?? p.Puntos ?? p.puntaje ?? p.Puntaje ?? 10),
        explicacion: p.explicacion ?? p.Explicacion ?? '',
        opciones: (p.opciones ?? p.Opciones ?? []).map((o: any) => ({
          texto: o.texto ?? o.Texto ?? o.contenido ?? o.Contenido ?? '',
          esCorrecta: Boolean(o.esCorrecta ?? o.EsCorrecta ?? o.correcta ?? o.Correcta ?? false),
        })),
      }));
    } catch (err) {
      console.error('❌ Error cargando preguntas:', err);
      this.notificationService.show('error', 'No se pudieron cargar las preguntas.');
      this.questionsList = [this.createEmptyQuestion()];
    } finally {
      this.isLoading.set(false);
    }
  }

  private createEmptyQuestion(): QuestionDraft {
    return {
      esExistente: false,
      texto: '',
      puntos: 10,
      explicacion: '',
      opciones: [
        { texto: '', esCorrecta: true },
        { texto: '', esCorrecta: false },
        { texto: '', esCorrecta: false },
        { texto: '', esCorrecta: false },
      ],
    };
  }

  addEmptyQuestion(): void {
    this.questionsList = [...this.questionsList, this.createEmptyQuestion()];
  }

  async removeQuestion(idx: number): Promise<void> {
    const question = this.questionsList[idx];
    if (!question) return;

    if (question.esExistente && question.id) {
      try {
        await firstValueFrom(
          this.http.delete(
            `${environment.evaluacionesApiUrl}/evaluaciones/${this.quizzId}/preguntas/${question.id}`
          )
        );
        this.notificationService.show('success', 'Pregunta eliminada.');
      } catch (err) {
        console.error('❌ Error eliminando pregunta:', err);
        this.notificationService.show('error', 'No se pudo eliminar la pregunta.');
        return;
      }
    }

    this.questionsList = this.questionsList.filter((_, i) => i !== idx);
    if (this.questionsList.length === 0) {
      this.questionsList = [this.createEmptyQuestion()];
    }
  }

  setCorrectOpcion(qIdx: number, oIdx: number): void {
    this.questionsList[qIdx].opciones.forEach((o, i) => (o.esCorrecta = i === oIdx));
  }

  addOpcion(qIdx: number): void {
    this.questionsList[qIdx].opciones.push({ texto: '', esCorrecta: false });
  }

  removeOpcion(qIdx: number, oIdx: number): void {
    const q = this.questionsList[qIdx];
    q.opciones = q.opciones.filter((_, i) => i !== oIdx);
  }

  async submitQuestions(): Promise<void> {
    const existingQuestions = this.questionsList.filter(q => q.esExistente && q.id) as Array<QuestionDraft & { id: string }>;
    const newQuestionsWithOrder = this.questionsList.map((q, idx) => ({ q, orden: idx + 1 })).filter(({ q }) => !q.esExistente);

    if (existingQuestions.length === 0 && newQuestionsWithOrder.length === 0) {
      this.close.emit();
      return;
    }

    this.isSaving.set(true);
    try {
      for (const q of existingQuestions) {
        const updateBody = {
          texto: q.texto,
          puntos: q.puntos,
          respuestaCorrecta: null,
          explicacion: q.explicacion || null,
          imagenUrl: null,
          opciones: q.opciones.map((o, oIdx) => ({ texto: o.texto, esCorrecta: o.esCorrecta, orden: oIdx + 1 })),
        };
        await firstValueFrom(this.http.put(`${environment.evaluacionesApiUrl}/evaluaciones/${this.quizzId}/preguntas/${q.id}`, updateBody));
      }

      for (const { q, orden } of newQuestionsWithOrder) {
        const createBody = {
          evaluacionId: this.quizzId,
          tipoPregunta: 1, // OpcionMultiple
          texto: q.texto,
          puntos: q.puntos,
          orden,
          explicacion: q.explicacion || null,
          respuestaCorrecta: null,
          opciones: q.opciones.map((o, oIdx) => ({ texto: o.texto, esCorrecta: o.esCorrecta, orden: oIdx + 1 })),
        };
        await firstValueFrom(this.http.post(`${environment.evaluacionesApiUrl}/evaluaciones/${this.quizzId}/preguntas`, createBody));
      }

      this.notificationService.show('success', 'Preguntas guardadas correctamente.');
      this.saved.emit();
      this.close.emit();
    } catch (err) {
      console.error('❌ Error guardando preguntas:', err);
      this.notificationService.show('error', 'Ocurrió un error al guardar las preguntas.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
