import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherQueryService } from '@features/teacher/infrastructure/queries/teacher-query.service';
import { environment } from '@environments/environment';

interface Evaluacion {
  id: string;
  nombre: string;
  peso: number;
  tipo: string;
}

interface CalificacionEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  estudianteCodigo: string;
  notas: { [key: string]: number | null };
  promedio: number;
  estado: string;
}

interface OpcionForm {
  id?: string;
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

interface PreguntaForm {
  id?: string;
  tipoPregunta: number; // 1=OpcionMultiple, 2=VerdaderoFalso, 3=RespuestaCorta, 4=Emparejamiento
  texto: string;
  puntos: number;
  orden: number;
  respuestaCorrecta?: string;
  explicacion?: string;
  imagenUrl?: string;
  opciones: OpcionForm[];
  esExistente?: boolean; // Para saber si es una pregunta que ya existía
}

interface CourseGradesData {
  courseId: string;
  courseName: string;
  courseCode: string;
  evaluaciones: Evaluacion[];
  calificaciones: CalificacionEstudiante[];
  estadisticas: {
    promedioGeneral: number;
    notaMasAlta: number;
    notaMasBaja: number;
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    totalEstudiantes: number;
  };
}

interface TeacherCourse {
  id: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-grades-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './grades-management.component.html',
  styles: ``,
})
export class GradesManagementComponent implements OnInit {
  protected readonly Math = Math;

  courses = signal<TeacherCourse[]>([]);
  selectedCourseId = signal<string>('');
  courseGradesData = signal<CourseGradesData | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  searchTerm = signal('');
  hasUnsavedChanges = signal(false);
  showCreateModal = signal(false);
  isEditMode = signal(false);
  editingEvaluationId = signal<string | null>(null);
  evaluationForm!: FormGroup;
  showNotificationModal = signal(false);
  notificationMessage = signal('');
  notificationType = signal<'success' | 'info' | 'warning' | 'error'>('success');

  // Gestión de Preguntas
  preguntas = signal<PreguntaForm[]>([]);
  showAddQuestionForm = signal(false);
  currentQuestion = signal<PreguntaForm | null>(null);
  editingQuestionIndex = signal<number | null>(null);
  questionForm!: FormGroup;
  opcionesForm: FormGroup[] = [];

  // Computed values
  evaluaciones = computed(() => this.courseGradesData()?.evaluaciones || []);
  calificaciones = computed(() => this.courseGradesData()?.calificaciones || []);
  estadisticas = computed(() => this.courseGradesData()?.estadisticas || null);

  filteredCalificaciones = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const califs = this.calificaciones();

    if (!term) return califs;

    return califs.filter(
      (c) =>
        c.estudianteNombre.toLowerCase().includes(term) ||
        c.estudianteCodigo.toLowerCase().includes(term),
    );
  });

  private docenteId = '';
  private userId = '';

  constructor(
    private http: HttpClient,
    private authRepository: AuthRepository,
    private teacherQueryService: TeacherQueryService,
    private fb: FormBuilder,
  ) {
    this.userId = this.authRepository.getCurrentUser()?.id ?? '';
    this.initEvaluationForm();
    this.initQuestionForm();
  }

  ngOnInit(): void {
    this.loadTeacherData();
  }

  async loadTeacherData(): Promise<void> {
    try {
      const info = await this.teacherQueryService.getTeacherInfo(this.userId);
      this.docenteId = info.id;
      await this.loadCourses();
    } catch (e) {
      console.error('❌ [GRADES] Error loading teacher data:', e);
      this.isLoading.set(false);
    }
  }

  // === GESTIÓN DE PREGUNTAS ===
  
  openAddQuestionForm(): void {
    this.showAddQuestionForm.set(true);
    this.currentQuestion.set(null);
    this.questionForm.reset({ tipoPregunta: 1, puntos: 1, orden: this.preguntas().length + 1 });
    this.opcionesForm = [];
    // Si es opción múltiple o verdadero/falso, agregar opciones por defecto
    if (this.questionForm.value.tipoPregunta === 1) {
      this.agregarOpcion();
      this.agregarOpcion();
    } else if (this.questionForm.value.tipoPregunta === 2) {
      this.opcionesForm = [
        this.fb.group({ texto: ['Verdadero', Validators.required], esCorrecta: [false], orden: [1] }),
        this.fb.group({ texto: ['Falso', Validators.required], esCorrecta: [false], orden: [2] }),
      ];
    }
  }

  closeAddQuestionForm(): void {
    this.showAddQuestionForm.set(false);
    this.currentQuestion.set(null);
    this.editingQuestionIndex.set(null);
    this.questionForm.reset();
    this.opcionesForm = [];
  }

  onTipoPreguntaChange(tipo: number): void {
    this.opcionesForm = [];
    
    if (tipo === 1) { // Opción Múltiple
      this.agregarOpcion();
      this.agregarOpcion();
    } else if (tipo === 2) { // Verdadero/Falso
      this.opcionesForm = [
        this.fb.group({ texto: ['Verdadero', Validators.required], esCorrecta: [false], orden: [1] }),
        this.fb.group({ texto: ['Falso', Validators.required], esCorrecta: [false], orden: [2] }),
      ];
    }
  }

  agregarOpcion(): void {
    const opcionForm = this.fb.group({
      texto: ['', Validators.required],
      esCorrecta: [false],
      orden: [this.opcionesForm.length + 1],
    });
    this.opcionesForm.push(opcionForm);
  }

  eliminarOpcion(index: number): void {
    if (this.opcionesForm.length > 2) {
      this.opcionesForm.splice(index, 1);
      // Actualizar orden
      this.opcionesForm.forEach((form, i) => {
        form.patchValue({ orden: i + 1 });
      });
    } else {
      this.showNotification('warning', 'Debe haber al menos 2 opciones');
    }
  }

  marcarOpcionCorrecta(index: number): void {
    const tipo = this.questionForm.value.tipoPregunta;
    
    if (tipo === 2) { // Verdadero/Falso: solo una correcta
      this.opcionesForm.forEach((form, i) => {
        form.patchValue({ esCorrecta: i === index });
      });
    } else if (tipo === 1) { // Opción Múltiple: puede haber múltiples correctas
      const currentValue = this.opcionesForm[index].value.esCorrecta;
      this.opcionesForm[index].patchValue({ esCorrecta: !currentValue });
    }
  }

  guardarPregunta(): void {
    // Si hay una pregunta en edición, delegar al método de guardar pregunta editada
    if (this.editingQuestionIndex() !== null) {
      this.guardarPreguntaEditada();
      return;
    }

    if (this.questionForm.invalid) {
      this.showNotification('warning', 'Complete todos los campos requeridos');
      return;
    }

    const tipo = this.questionForm.value.tipoPregunta;
    const opciones: OpcionForm[] = this.opcionesForm.map(form => form.value);
    
    // Validar que haya al menos una opción correcta para tipos con opciones
    if (tipo === 1 || tipo === 2) {
      const hayCorrecta = opciones.some(o => o.esCorrecta);
      if (!hayCorrecta) {
        this.showNotification('warning', 'Debe marcar al menos una opción como correcta');
        return;
      }
    }

    const pregunta: PreguntaForm = {
      ...this.questionForm.value,
      opciones: tipo === 1 || tipo === 2 ? opciones : [],
    };

    const preguntasActuales = this.preguntas();
    this.preguntas.set([...preguntasActuales, pregunta]);
    
    this.showNotification('success', 'Pregunta agregada correctamente');
    this.closeAddQuestionForm();
  }

  eliminarPregunta(index: number): void {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      const preguntasActuales = this.preguntas();
      preguntasActuales.splice(index, 1);
      // Actualizar orden
      preguntasActuales.forEach((p, i) => {
        p.orden = i + 1;
      });
      this.preguntas.set([...preguntasActuales]);
      this.showNotification('success', 'Pregunta eliminada');
    }
  }

  getTipoPreguntaLabel(tipo: number): string {
    const tipos: Record<number, string> = {
      1: 'Opción Múltiple',
      2: 'Verdadero/Falso',
      3: 'Respuesta Corta',
      4: 'Emparejamiento',
    };
    return tipos[tipo] || 'Desconocido';
  }

  async loadCourses(): Promise<void> {
    try {
      const courses = await this.teacherQueryService.getTeacherCourses(this.userId);
      this.courses.set(courses.map((c) => ({ id: c.id, codigo: c.codigo, titulo: c.titulo })));
      if (courses.length > 0) {
        this.selectedCourseId.set(courses[0].id);
        this.loadGrades();
      } else {
        this.isLoading.set(false);
      }
    } catch (e) {
      console.error('❌ [GRADES] Error loading courses:', e);
      this.isLoading.set(false);
    }
  }

  onCourseChange(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    const courseId = this.selectedCourseId();
    if (!courseId || !this.docenteId) return;

    this.isLoading.set(true);

    forkJoin({
      evalResp: this.http.get<{ evaluaciones: any[] }>(
        `${environment.evaluacionesApiUrl}/evaluaciones?cursoId=${courseId}`
      ),
      estudiantes: this.http.get<any[]>(
        `${environment.estudiantesApiUrl}/estudiantes/por-docente/${this.docenteId}`
      ),
      calificaciones: this.http.get<any>(
        `${environment.evaluacionesApiUrl}/evaluaciones/cursos/${courseId}/calificaciones`
      ),
    }).subscribe({
      next: ({ evalResp, estudiantes, calificaciones }) => {
        const evals: any[] = evalResp.evaluaciones ?? [];

        // Calcular peso proporcional al puntajeMaximo
        const totalPeso = evals.reduce((s, e) => s + (Number(e.puntajeMaximo) || 0), 0) || 100;
        const mappedEvals: Evaluacion[] = evals.map((e) => ({
          id: e.id,
          nombre: e.titulo,
          peso: Math.round((Number(e.puntajeMaximo) / totalPeso) * 100),
          tipo: e.tipo,
        }));

        // Crear mapa de calificaciones existentes por estudiante
        const calificacionesMap = new Map<string, { [key: string]: number | null }>();
        if (calificaciones?.calificaciones) {
          for (const cal of calificaciones.calificaciones) {
            const notasPorEval: { [key: string]: number | null } = {};
            for (const [evalId, notaData] of Object.entries(cal.notasPorEvaluacion || {})) {
              notasPorEval[evalId] = (notaData as any)?.nota ?? null;
            }
            calificacionesMap.set(cal.estudianteId, notasPorEval);
          }
        }

        // Crear array de calificaciones por estudiante
        const califs: CalificacionEstudiante[] = estudiantes.map((s: any) => {
          const estudianteId = s.estudianteId ?? s.id ?? '';
          
          // Obtener notas existentes o crear vacías
          const notasExistentes = calificacionesMap.get(estudianteId) || {};
          const notas: { [key: string]: number | null } = {};
          mappedEvals.forEach((e) => {
            notas[e.id] = notasExistentes[e.id] ?? null;
          });

          const estudiante: CalificacionEstudiante = {
            estudianteId,
            estudianteNombre: s.nombreCompleto ?? '',
            estudianteCodigo:
              s.codigoEstudiante ??
              (s.usuarioId ?? '').substring(0, 8).toUpperCase(),
            notas,
            promedio: 0,
            estado: 'Pendiente',
          };

          // Calcular promedio inicial
          this.calculateStudentAverage(estudiante);
          return estudiante;
        });

        // Calcular estadísticas
        const estadisticas = this.calculateStatistics(califs);

        const course = this.courses().find((c) => c.id === courseId);
        this.courseGradesData.set({
          courseId,
          courseName: course?.titulo ?? '',
          courseCode: course?.codigo ?? '',
          evaluaciones: mappedEvals,
          calificaciones: califs,
          estadisticas,
        });
        this.isLoading.set(false);
        console.log(`✅ [GRADES] ${mappedEvals.length} evaluaciones y ${califs.length} estudiantes cargados con calificaciones.`);
      },
      error: (error) => {
        console.error('❌ [GRADES] Error loading grades:', error);
        this.isLoading.set(false);
      },
    });
  }

  onGradeChange(estudianteId: string, evaluacionId: string, value: string): void {
    const califs = this.calificaciones();
    const estudiante = califs.find((c) => c.estudianteId === estudianteId);

    if (estudiante) {
      const numValue = value === '' ? null : parseFloat(value);
      estudiante.notas[evaluacionId] = numValue;
      this.hasUnsavedChanges.set(true);
      this.calculateStudentAverage(estudiante);
      
      // Recalcular estadísticas
      const currentData = this.courseGradesData();
      if (currentData) {
        const newStats = this.calculateStatistics(califs);
        this.courseGradesData.set({
          ...currentData,
          estadisticas: newStats,
        });
      }
    }
  }

  calculateStudentAverage(estudiante: CalificacionEstudiante): void {
    const evaluaciones = this.evaluaciones();
    let totalWeighted = 0;
    let totalWeight = 0;

    evaluaciones.forEach((evaluation) => {
      const nota = estudiante.notas[evaluation.id];
      if (nota !== null && nota !== undefined) {
        totalWeighted += nota * (evaluation.peso / 100);
        totalWeight += evaluation.peso / 100;
      }
    });

    estudiante.promedio = totalWeight > 0 ? totalWeighted / totalWeight : 0;

    // Actualizar estado
    if (estudiante.promedio >= 14) {
      estudiante.estado = 'Aprobado';
    } else if (estudiante.promedio >= 10.5) {
      estudiante.estado = 'En Riesgo';
    } else {
      estudiante.estado = 'Reprobado';
    }
  }

  calculateStatistics(calificaciones: CalificacionEstudiante[]): {
    promedioGeneral: number;
    notaMasAlta: number;
    notaMasBaja: number;
    aprobados: number;
    reprobados: number;
    enRiesgo: number;
    totalEstudiantes: number;
  } {
    if (calificaciones.length === 0) {
      return {
        promedioGeneral: 0,
        notaMasAlta: 0,
        notaMasBaja: 0,
        aprobados: 0,
        reprobados: 0,
        enRiesgo: 0,
        totalEstudiantes: 0,
      };
    }

    // Filtrar estudiantes que tienen al menos una nota
    const estudiantesConNotas = calificaciones.filter((c) => c.promedio > 0);

    if (estudiantesConNotas.length === 0) {
      return {
        promedioGeneral: 0,
        notaMasAlta: 0,
        notaMasBaja: 0,
        aprobados: 0,
        reprobados: 0,
        enRiesgo: 0,
        totalEstudiantes: calificaciones.length,
      };
    }

    const promedios = estudiantesConNotas.map((c) => c.promedio);
    const promedioGeneral = promedios.reduce((sum, p) => sum + p, 0) / promedios.length;
    const notaMasAlta = Math.max(...promedios);
    const notaMasBaja = Math.min(...promedios);

    const aprobados = estudiantesConNotas.filter((c) => c.promedio >= 14).length;
    const enRiesgo = estudiantesConNotas.filter((c) => c.promedio >= 10.5 && c.promedio < 14).length;
    const reprobados = estudiantesConNotas.filter((c) => c.promedio < 10.5).length;

    return {
      promedioGeneral,
      notaMasAlta,
      notaMasBaja,
      aprobados,
      reprobados,
      enRiesgo,
      totalEstudiantes: calificaciones.length,
    };
  }

  saveChanges(): void {
    if (!this.hasUnsavedChanges() || this.isSaving()) return;

    const evals = this.evaluaciones();
    const califs = this.calificaciones();
    if (evals.length === 0 || califs.length === 0) return;

    this.isSaving.set(true);

    // Build one request per evaluación that has at least one grade
    const requests = evals
      .map((ev) => {
        const entradas = califs
          .filter((c) => c.notas[ev.id] !== null && c.notas[ev.id] !== undefined)
          .map((c) => ({ estudianteId: c.estudianteId, nota: c.notas[ev.id] as number }));

        if (entradas.length === 0) return null;
        return this.http
          .post(
            `${environment.evaluacionesApiUrl}/evaluaciones/${ev.id}/calificaciones`,
            entradas,
          )
          .toPromise();
      })
      .filter((r) => r !== null) as Promise<unknown>[];

    if (requests.length === 0) {
      this.isSaving.set(false);
      return;
    }

    Promise.all(requests)
      .then(() => {
        this.hasUnsavedChanges.set(false);
        this.showNotification('success', `Calificaciones guardadas exitosamente`);
      })
      .catch((err) => {
        console.error('❌ [GRADES] Error saving grades:', err);
        this.showNotification('error', 'Error al guardar calificaciones. Intente nuevamente.');
      })
      .finally(() => this.isSaving.set(false));
  }

  exportToCSV(): void {
    const evals = this.evaluaciones();
    const califs = this.calificaciones();
    const course = this.courseGradesData();
    if (!course || califs.length === 0) return;

    const headers = ['Estudiante', 'Código', ...evals.map((e) => e.nombre), 'Promedio', 'Estado'];
    const rows = califs.map((c) => [
      `"${c.estudianteNombre}"`,
      c.estudianteCodigo,
      ...evals.map((e) => (c.notas[e.id] ?? '')),
      c.promedio > 0 ? c.promedio.toFixed(2) : '',
      c.estado,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calificaciones_${course.courseCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      Aprobado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'En Riesgo': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      Reprobado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  }

  getGradeColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'text-gray-400';
    if (grade >= 14) return 'text-green-600 dark:text-green-400 font-semibold';
    if (grade >= 10.5) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  getInputBorderColor(grade: number | null): string {
    if (grade === null || grade === undefined) return 'border-gray-600';
    if (grade >= 14) return 'border-green-500';
    if (grade >= 10.5) return 'border-orange-500';
    return 'border-red-500';
  }

  initEvaluationForm(): void {
    this.evaluationForm = this.fb.group({
      cursoId: ['', [Validators.required]],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      tipo: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      duracionMinutos: [60, [Validators.required, Validators.min(1)]],
      peso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      puntajeMaximo: [20, [Validators.required, Validators.min(1)]],
      intentosMaximos: [1, [Validators.required, Validators.min(1)]],
    });
  }

  initQuestionForm(): void {
    this.questionForm = this.fb.group({
      tipoPregunta: [1, [Validators.required]], // OpcionMultiple por defecto
      texto: ['', [Validators.required, Validators.minLength(5)]],
      puntos: [1, [Validators.required, Validators.min(1)]],
      orden: [1, [Validators.required]],
      respuestaCorrecta: [''],
      explicacion: [''],
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingEvaluationId.set(null);
    // Si hay un curso seleccionado, prellenar el campo
    const selectedId = this.selectedCourseId();
    if (selectedId) {
      this.evaluationForm.patchValue({ cursoId: selectedId });
    }
    this.showCreateModal.set(true);
  }

  openEditModal(evaluacion: Evaluacion): void {
    this.isEditMode.set(true);
    this.editingEvaluationId.set(evaluacion.id);
    this.cargarPreguntasExistentes(evaluacion.id);
    
    // Prellenar el formulario con los datos existentes
    // Necesitamos obtener los datos completos de la evaluación desde el backend
    this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacion.id}`).subscribe({
      next: (data) => {
        this.evaluationForm.patchValue({
          cursoId: data.cursoId,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fechaInicio: new Date(data.fechaInicio).toISOString().slice(0, 16),
          fechaFin: new Date(data.fechaFin).toISOString().slice(0, 16),
          peso: evaluacion.peso,
          puntajeMaximo: data.puntajeMaximo,
          tipo: evaluacion.tipo,
        });
        this.showCreateModal.set(true);
      },
      error: (err) => {
        console.error('❌ [GRADES] Error loading evaluation:', err);
        this.showNotification('error', 'Error al cargar la evaluación');
      },
    });
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.isEditMode.set(false);
    this.editingEvaluationId.set(null);
    this.evaluationForm.reset({
      duracionMinutos: 60,
      peso: 0,
      puntajeMaximo: 20,
      intentosMaximos: 1,
    });
    // Limpiar preguntas
    this.preguntas.set([]);
    this.showAddQuestionForm.set(false);
    this.currentQuestion.set(null);
    this.editingQuestionIndex.set(null);
  }

  agregarPreguntasAEvaluacion(evaluacionId: string, preguntas: PreguntaForm[]): void {
    console.log(`📝 [GRADES] Agregando ${preguntas.length} preguntas...`);
    
    const requests = preguntas.map(pregunta => {
      const preguntaData = {
        evaluacionId,
        tipoPregunta: pregunta.tipoPregunta,
        texto: pregunta.texto,
        puntos: pregunta.puntos,
        orden: pregunta.orden,
        respuestaCorrecta: pregunta.respuestaCorrecta || null,
        explicacion: pregunta.explicacion || null,
        opciones: pregunta.opciones.length > 0 ? pregunta.opciones.map(o => ({
          texto: o.texto,
          esCorrecta: o.esCorrecta,
          orden: o.orden
        })) : null
      };
      
      return this.http.post(
        `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`,
        preguntaData
      );
    });
    
    forkJoin(requests).subscribe({
      next: () => {
        console.log('✅ [GRADES] Preguntas agregadas exitosamente');
        this.closeCreateModal();
        this.showNotification('success', `Evaluación creada con ${preguntas.length} preguntas`);
        this.loadGrades();
      },
      error: (err) => {
        console.error('❌ [GRADES] Error agregando preguntas:', err);
        this.showNotification('warning', 'Evaluación creada, pero hubo errores al agregar preguntas');
        this.closeCreateModal();
        this.loadGrades();
      }
    });
  }

  onSubmitEvaluation(): void {
    if (this.evaluationForm.invalid) {
      Object.keys(this.evaluationForm.controls).forEach((key) => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.isEditMode()) {
      this.updateEvaluation();
    } else {
      this.createEvaluation();
    }
  }

  createEvaluation(): void {
    const formValue = this.evaluationForm.value;
    const evaluationData = {
      ...formValue,
      fechaInicio: new Date(formValue.fechaInicio).toISOString(),
      fechaFin: new Date(formValue.fechaFin).toISOString(),
      preguntas: [],
      configuracion: {
        mostrarResultadoInmediato: false,
        permitirRevision: false,
        ordenAleatorio: false,
        mostrarUnaVez: false,
        requiereWebcam: false,
      },
    };

    this.http.post<{ id: string }>(`${environment.evaluacionesApiUrl}/evaluaciones`, evaluationData).subscribe({
      next: (response) => {
        const evaluacionId = response.id;
        console.log('✅ [GRADES] Evaluación creada:', evaluacionId);
        
        // Si hay preguntas, agregarlas
        const preguntasToAdd = this.preguntas();
        if (preguntasToAdd.length > 0) {
          this.agregarPreguntasAEvaluacion(evaluacionId, preguntasToAdd);
        } else {
          this.closeCreateModal();
          this.showNotification('success', 'Evaluación creada exitosamente');
          this.loadGrades();
        }
      },
      error: (err) => {
        console.error('❌ [GRADES] Error creating evaluation:', err);
        this.showNotification('error', 'Error al crear la evaluación. Intente nuevamente.');
      },
    });
  }

  updateEvaluation(): void {
    const formValue = this.evaluationForm.value;
    const evaluationData = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion,
      fechaInicio: new Date(formValue.fechaInicio).toISOString(),
      fechaFin: new Date(formValue.fechaFin).toISOString(),
      puntajeMaximo: formValue.puntajeMaximo,
      tipoEvaluacion: this.mapTipoToEnum(formValue.tipo),
    };

    const evaluacionId = this.editingEvaluationId();
    this.http.put(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}`, evaluationData).subscribe({
      next: () => {
        // Agregar nuevas preguntas si hay
        const preguntasNuevas = this.preguntas().filter(p => !p.esExistente);
        if (preguntasNuevas.length > 0) {
          this.agregarPreguntasAEvaluacion(evaluacionId!, preguntasNuevas);
        } else {
          this.closeCreateModal();
          this.showNotification('success', 'Evaluación actualizada exitosamente');
          this.loadGrades();
        }
      },
      error: (err) => {
        console.error('❌ [GRADES] Error updating evaluation:', err);
        this.showNotification('error', 'Error al actualizar la evaluación. Intente nuevamente.');
      },
    });
  }

  mapTipoToEnum(tipo: string): number {
    const tiposMap: { [key: string]: number } = {
      'Examen': 0,
      'Practica': 1,
      'Quiz': 2,
      'Parcial': 3,
      'Final': 4,
      'Tarea': 5,
    };
    return tiposMap[tipo] ?? 0;
  }

  deleteEvaluation(evaluacionId: string): void {
    if (!confirm('¿Estás seguro de eliminar esta evaluación? Esta acción no se puede deshacer.')) {
      return;
    }

    this.http.delete(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}`).subscribe({
      next: () => {
        this.showNotification('success', 'Evaluación eliminada exitosamente');
        this.loadGrades();
      },
      error: (err) => {
        console.error('❌ [GRADES] Error deleting evaluation:', err);
        this.showNotification('error', 'Error al eliminar la evaluación. Intente nuevamente.');
      },
    });
  }

  showNotification(type: 'success' | 'info' | 'warning' | 'error', message: string): void {
    this.notificationType.set(type);
    this.notificationMessage.set(message);
    this.showNotificationModal.set(true);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      this.closeNotificationModal();
    }, 3000);
  }

  closeNotificationModal(): void {
    this.showNotificationModal.set(false);
  }

  cargarPreguntasExistentes(evaluacionId: string): void {
    console.log('📖 [GRADES] Cargando preguntas de evaluación:', evaluacionId);
    this.http.get<any>(`${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas`).subscribe({
      next: (response) => {
        const preguntasCargadas: PreguntaForm[] = response.preguntas.map((p: any) => ({
          id: p.id,
          tipoPregunta: this.mapTipoStringToEnum(p.tipo),
          texto: p.texto,
          puntos: p.puntos,
          orden: p.orden,
          respuestaCorrecta: p.respuestaCorrecta,
          explicacion: p.explicacion,
          imagenUrl: p.imagenUrl,
          opciones: p.opciones?.map((o: any) => ({
            id: o.id,
            texto: o.texto,
            esCorrecta: o.esCorrecta,
            orden: o.orden
          })) || [],
          esExistente: true
        }));
        
        this.preguntas.set(preguntasCargadas);
        console.log('✅ [GRADES] Preguntas cargadas:', preguntasCargadas.length);
      },
      error: (err) => {
        console.error('❌ [GRADES] Error cargando preguntas:', err);
        this.preguntas.set([]);
      }
    });
  }

  mapTipoStringToEnum(tipo: string): number {
    const tiposMap: { [key: string]: number } = {
      'multiple-choice': 1,
      'true-false': 2,
      'short-answer': 3,
      'matching': 4
    };
    return tiposMap[tipo] || 1;
  }

  openEditQuestionForm(index: number): void {
    const pregunta = this.preguntas()[index];
    if (!pregunta.esExistente) {
      this.showNotification('warning', 'Solo se pueden editar preguntas guardadas');
      return;
    }

    this.editingQuestionIndex.set(index);
    this.currentQuestion.set(pregunta);
    this.showAddQuestionForm.set(true);

    // Prellenar formulario
    this.questionForm.patchValue({
      tipoPregunta: pregunta.tipoPregunta,
      texto: pregunta.texto,
      puntos: pregunta.puntos,
      orden: pregunta.orden,
      respuestaCorrecta: pregunta.respuestaCorrecta || '',
      explicacion: pregunta.explicacion || ''
    });

    // Prellenar opciones
    this.opcionesForm = pregunta.opciones.map(o => 
      this.fb.group({
        id: [o.id],
        texto: [o.texto, Validators.required],
        esCorrecta: [o.esCorrecta],
        orden: [o.orden]
      })
    );
  }

  guardarPreguntaEditada(): void {
    if (this.questionForm.invalid) {
      this.showNotification('warning', 'Complete todos los campos requeridos');
      return;
    }

    const tipo = this.questionForm.value.tipoPregunta;
    const opciones: OpcionForm[] = this.opcionesForm.map(form => form.value);

    if (tipo === 1 || tipo === 2) {
      const hayCorrecta = opciones.some(o => o.esCorrecta);
      if (!hayCorrecta) {
        this.showNotification('warning', 'Debe marcar al menos una opción como correcta');
        return;
      }
    }

    const index = this.editingQuestionIndex();
    if (index === null) return;

    const pregunta = this.preguntas()[index];
    const evaluacionId = this.editingEvaluationId();

    // Actualizar pregunta en el backend
    const updateData = {
      texto: this.questionForm.value.texto,
      puntos: this.questionForm.value.puntos,
      respuestaCorrecta: this.questionForm.value.respuestaCorrecta || null,
      explicacion: this.questionForm.value.explicacion || null,
      imagenUrl: pregunta.imagenUrl || null,
      opciones: tipo === 1 || tipo === 2 ? opciones.map(o => ({
        texto: o.texto,
        esCorrecta: o.esCorrecta,
        orden: o.orden
      })) : null
    };

    this.http.put(
      `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas/${pregunta.id}`,
      updateData
    ).subscribe({
      next: () => {
        // Actualizar en el signal
        const preguntasActualizadas = [...this.preguntas()];
        preguntasActualizadas[index] = {
          ...pregunta,
          texto: updateData.texto,
          puntos: updateData.puntos,
          respuestaCorrecta: updateData.respuestaCorrecta,
          explicacion: updateData.explicacion,
          opciones: tipo === 1 || tipo === 2 ? opciones : []
        };
        this.preguntas.set(preguntasActualizadas);
        this.showNotification('success', 'Pregunta actualizada correctamente');
        this.closeAddQuestionForm();
      },
      error: (err) => {
        console.error('❌ [GRADES] Error actualizando pregunta:', err);
        this.showNotification('error', 'Error al actualizar la pregunta');
      }
    });
  }

  eliminarPreguntaExistente(index: number): void {
    const pregunta = this.preguntas()[index];
    if (!pregunta.esExistente || !pregunta.id) {
      this.showNotification('warning', 'Solo se pueden eliminar preguntas guardadas');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer.')) {
      return;
    }

    const evaluacionId = this.editingEvaluationId();
    this.http.delete(
      `${environment.evaluacionesApiUrl}/evaluaciones/${evaluacionId}/preguntas/${pregunta.id}`
    ).subscribe({
      next: () => {
        const preguntasActualizadas = this.preguntas();
        preguntasActualizadas.splice(index, 1);
        this.preguntas.set([...preguntasActualizadas]);
        this.showNotification('success', 'Pregunta eliminada correctamente');
      },
      error: (err) => {
        console.error('❌ [GRADES] Error eliminando pregunta:', err);
        this.showNotification('error', 'Error al eliminar la pregunta');
      }
    });
  }
}

