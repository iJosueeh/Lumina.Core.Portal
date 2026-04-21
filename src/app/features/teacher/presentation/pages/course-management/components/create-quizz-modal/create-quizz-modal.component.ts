import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-create-quizz-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-quizz-modal.component.html',
  styleUrl: './create-quizz-modal.component.css'
})
export class CreateQuizzModalComponent {
  @Input({ required: true }) courseId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<{ id: string; titulo: string }>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private teacherQuery = inject(TeacherQueryService);
  private notificationService = inject(NotificationService);

  isSaving = signal(false);
  quizzForm = {
    titulo: '',
    descripcion: '',
    fechaInicio: new Date().toISOString().slice(0, 16),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    puntajeMaximo: 100,
  };

  async submitForm(): Promise<void> {
    const usuarioId = this.authService.getUserId() || '';
    this.isSaving.set(true);

    try {
      const teacherInfo = await this.teacherQuery.getTeacherInfo(usuarioId);
      const body = {
        cursoId: this.courseId,
        docenteId: teacherInfo.id,
        titulo: this.quizzForm.titulo,
        descripcion: this.quizzForm.descripcion,
        fechaInicio: new Date(this.quizzForm.fechaInicio).toISOString(),
        fechaFin: new Date(this.quizzForm.fechaFin).toISOString(),
        puntajeMaximo: Number(this.quizzForm.puntajeMaximo),
        tipoEvaluacion: 4, // Quizz
      };

      const newId = await firstValueFrom(
        this.http.post<string>(`${environment.evaluacionesApiUrl}/evaluaciones`, body)
      );

      this.notificationService.show('success', 'Evaluación creada. Ahora puedes gestionar sus preguntas.');
      this.created.emit({ id: String(newId), titulo: this.quizzForm.titulo });
    } catch (err) {
      console.error('❌ Error creando quizz:', err);
      this.notificationService.show('error', 'No se pudo crear la evaluación quizz.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
