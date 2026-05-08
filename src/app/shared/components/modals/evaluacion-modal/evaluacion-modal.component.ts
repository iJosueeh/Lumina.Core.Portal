import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { NotificationService } from '@shared/services/notification.service';
import { EvaluacionApi } from '@shared/models/course-management.models';

@Component({
  selector: 'app-evaluacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './evaluacion-modal.component.html',
  styleUrl: './evaluacion-modal.component.css'
})
export class EvaluacionModalComponent implements OnInit {
  @Input({ required: true }) courseId!: string;
  @Input() docenteId?: string | null;
  @Input() evaluacionToEdit: EvaluacionApi | null = null;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<{ id: string; titulo: string }>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  evaluacionForm: FormGroup;
  isSaving = signal(false);
  isEditMode = signal(false);

  constructor() {
    this.evaluacionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      fechaInicio: [this.formatDateForInput(new Date()), [Validators.required]],
      fechaFin: [this.formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), [Validators.required]],
      puntajeMaximo: [100, [Validators.required, Validators.min(1)]],
      tipoEvaluacion: [4, [Validators.required]], // Default Quizz
      intentosPermitidos: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    if (this.evaluacionToEdit) {
      this.isEditMode.set(true);
      this.evaluacionForm.patchValue({
        titulo: this.evaluacionToEdit.titulo,
        descripcion: '',
        fechaInicio: this.formatDateForInput(new Date(this.evaluacionToEdit.fechaInicio)),
        fechaFin: this.formatDateForInput(new Date(this.evaluacionToEdit.fechaFin)),
        puntajeMaximo: this.evaluacionToEdit.puntajeMaximo,
        tipoEvaluacion: this.mapTipoToEnum(this.evaluacionToEdit.tipoEvaluacion),
        intentosPermitidos: (this.evaluacionToEdit as any).intentosPermitidos || 1
      });
      
      this.loadFullDetail();
    }
  }

  private async loadFullDetail(): Promise<void> {
    if (!this.evaluacionToEdit) return;
    try {
      const detail = await firstValueFrom(
        this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones/${this.evaluacionToEdit.id}`)
      );
      
      console.log('📦 [EVAL-MODAL] Detalle cargado:', detail);

      this.evaluacionForm.patchValue({
        descripcion: detail.descripcion || '',
        tipoEvaluacion: this.mapTipoToEnum(detail.tipoEvaluacion),
        intentosPermitidos: detail.intentosPermitidos || 1
      }, { emitEvent: false }); // Evitar marcar como dirty inmediatamente

    } catch (err) {
      console.warn('⚠️ No se pudo cargar el detalle completo de la evaluación', err);
    }
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  private mapTipoToEnum(tipo: any): number {
    if (typeof tipo === 'number') return tipo;
    if (!tipo) return 4;
    
    switch (tipo.toLowerCase()) {
      case 'examen': return 1;
      case 'tarea': return 2;
      case 'proyecto': return 3;
      case 'quizz': case 'test': return 4;
      default: return 4;
    }
  }

  async submit(): Promise<void> {
    if (this.evaluacionForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.evaluacionForm.value;
    
    try {
      if (this.isEditMode() && this.evaluacionToEdit) {
        // Enviar solo campos modificados (Partial Update)
        const updateBody: any = { evaluacionId: this.evaluacionToEdit.id };
        const controls = this.evaluacionForm.controls;

        if (controls['titulo'].dirty) updateBody.titulo = formValue.titulo;
        if (controls['descripcion'].dirty) updateBody.descripcion = formValue.descripcion;
        if (controls['fechaInicio'].dirty) updateBody.fechaInicio = new Date(formValue.fechaInicio).toISOString();
        if (controls['fechaFin'].dirty) updateBody.fechaFin = new Date(formValue.fechaFin).toISOString();
        if (controls['puntajeMaximo'].dirty) updateBody.puntajeMaximo = Number(formValue.puntajeMaximo);
        if (controls['tipoEvaluacion'].dirty) updateBody.tipoEvaluacion = Number(formValue.tipoEvaluacion);
        if (controls['intentosPermitidos'].dirty) updateBody.intentosPermitidos = Number(formValue.intentosPermitidos);
        
        console.log('📡 [EVAL-MODAL] Enviando actualización parcial:', updateBody);

        await firstValueFrom(
          this.http.put(`${environment.evaluacionesApiUrl}/evaluaciones/${this.evaluacionToEdit.id}`, updateBody)
        );
        
        this.notificationService.show('success', 'Evaluación actualizada correctamente.');
        this.onSaved.emit({ id: this.evaluacionToEdit.id, titulo: formValue.titulo });
      } else {
        const body = {
          cursoId: this.courseId,
          docenteId: this.docenteId,
          titulo: formValue.titulo,
          descripcion: formValue.descripcion,
          fechaInicio: new Date(formValue.fechaInicio).toISOString(),
          fechaFin: new Date(formValue.fechaFin).toISOString(),
          puntajeMaximo: Number(formValue.puntajeMaximo),
          tipoEvaluacion: Number(formValue.tipoEvaluacion),
          intentosPermitidos: Number(formValue.intentosPermitidos)
        };

        console.log('📡 [EVAL-MODAL] Creando nueva evaluación:', body);

        const response = await firstValueFrom(
          this.http.post<any>(`${environment.evaluacionesApiUrl}/evaluaciones`, body)
        );
        
        const newId = response.value || response.id || response;
        
        this.notificationService.show('success', 'Evaluación creada correctamente.');
        this.onSaved.emit({ id: String(newId), titulo: formValue.titulo });
      }
      this.onClose.emit();
    } catch (err) {
      console.error('❌ Error guardando evaluación:', err);
      this.notificationService.show('error', 'Ocurrió un error al guardar la evaluación.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
