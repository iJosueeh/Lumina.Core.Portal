import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../infrastructure/services/admin.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-course-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './course-management.html',
  styleUrl: './course-management.css',
})
export class CourseManagement implements OnInit {
  allCourses: any[] = [];
  filteredCourses: any[] = [];
  paginatedCourses: any[] = [];

  // Filters
  searchTerm = '';
  selectedStatus = 'Estado: Todos';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;

  // Modals
  isModalOpen = false;
  isDeleteModalOpen = false;
  activeTab = 'general'; // 'general' | 'modules' | 'evaluations'

  // Form/Action Data
  currentCourse: any = { 
    name: '', 
    code: '', 
    teacherName: '', 
    capacity: 150, 
    status: 'DRAFT',
    description: '',
    ciclo: '',
    creditos: 0,
    modules: [],
    evaluaciones: [],
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop' 
  };
  courseToDelete: any = null;
  newModuleTitle = '';
  
  // Docentes
  docentes: any[] = [];
  docentesLoading = false;

  // New Evaluation Form Data
  newEval: any = { nombre: '', tipo: 'Examen', peso: 0, fechaLimite: '', preguntas: [] };
  isEditingEvaluation = false;
  editingEvaluationIndex = -1;
  
  // Quiz Editor
  showQuestionEditor = false;
  editingEvalIndex = -1;
  questionsList: any[] = [];

  isEditing = false;
  isLoading = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.startLoading();
  }

  startLoading() {
      this.isLoading = true;
      this.adminService.getCourses().subscribe({
          next: (courses) => {
              this.allCourses = courses;
              this.applyFilters();
              this.isLoading = false;
          },
          error: () => { this.isLoading = false; }
      });
  }

  applyFilters() {
      let temp = [...this.allCourses];

      if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          temp = temp.filter(c => 
              (c.name && c.name.toLowerCase().includes(term)) || 
              (c.code && c.code.toLowerCase().includes(term)) ||
              (c.teacherName && c.teacherName.toLowerCase().includes(term))
          );
      }

      if (this.selectedStatus !== 'Estado: Todos') {
           const statusMap: Record<string, string> = { 'Publicado': 'PUBLISHED', 'Borrador': 'DRAFT', 'Archivado': 'ARCHIVED' };
           const mappedStatus = statusMap[this.selectedStatus] || this.selectedStatus;
           temp = temp.filter(c => c.status === mappedStatus);
      }

      this.filteredCourses = temp;
      this.totalItems = this.filteredCourses.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      if (this.totalPages === 0) this.totalPages = 1;
      this.goToPage(1);
  }

  goToPage(page: number) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      const startIndex = (page - 1) * this.itemsPerPage;
      this.paginatedCourses = this.filteredCourses.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Actions
  openCreateModal() {
      this.isEditing = false;
      this.activeTab = 'general';
      this.currentCourse = { 
          name: '', code: '', teacherName: '', instructorId: null, capacity: 150, status: 'DRAFT', 
          description: '', ciclo: '2024-1', creditos: 3,
          modules: [], evaluaciones: [],
          coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'
      };
      this.loadDocentes(true);
      this.isModalOpen = true;
  }

  openEditModal(course: any) {
      this.isEditing = true;
      this.activeTab = 'general';
      // Deep copy to prevent mutating list directly while editing
      this.currentCourse = JSON.parse(JSON.stringify(course));
      if(!this.currentCourse.modules) this.currentCourse.modules = [];
      if(!this.currentCourse.evaluaciones) this.currentCourse.evaluaciones = [];
      this.currentCourse.modules = this.normalizeModules(this.currentCourse.modules);
      this.currentCourse.evaluaciones = this.normalizeEvaluaciones(this.currentCourse.evaluaciones);

      this.isModalOpen = true;

      // Cargar detalle real para prellenar módulos/metadata existentes del curso.
      if (this.currentCourse.id) {
          this.adminService.getCourseDetail(this.currentCourse.id).subscribe({
              next: (courseDetail) => {
                  const selectedInstructorId = this.normalizeGuidValue(this.currentCourse?.instructorId);
                  const detailInstructorId = this.normalizeGuidValue(courseDetail?.instructorId);
                  const finalInstructorId = selectedInstructorId ?? detailInstructorId ?? null;

                  this.currentCourse = {
                      ...this.currentCourse,
                      ...courseDetail,
                      instructorId: finalInstructorId,
                      modules: this.normalizeModules(courseDetail?.modules || this.currentCourse.modules),
                      evaluaciones: this.normalizeEvaluaciones(this.currentCourse.evaluaciones)
                  };
              },
              error: (err) => {
                  console.warn('⚠️ No se pudo cargar detalle de curso, usando datos de lista:', err);
              }
          });
      }
      
      // Cargar evaluaciones del curso desde el microservicio de Evaluaciones
      if (this.currentCourse.id) {
          console.log('🔍 Cargando evaluaciones del curso:', this.currentCourse.id);
          this.adminService.getCourseEvaluations(this.currentCourse.id).subscribe({
              next: (evaluaciones) => {
                  console.log('✅ Evaluaciones cargadas:', evaluaciones.length);
                  this.currentCourse.evaluaciones = this.normalizeEvaluaciones(evaluaciones);
              },
              error: (err) => {
                  console.error('❌ Error cargando evaluaciones:', err);
              }
          });
      }

      // Cargar docentes disponibles
      this.loadDocentes(true);
  }

  loadDocentes(forceReload = false) {
      if (!forceReload && this.docentes.length > 0) {
          return;
      }

      this.docentesLoading = true;
      this.adminService.getDocentes().subscribe({
          next: (docentes) => {
              this.docentes = docentes;
              this.docentesLoading = false;
              console.log('👨‍🏫 Docentes cargados:', this.docentes.length);
          },
          error: (err) => {
              console.error('❌ Error cargando docentes:', err);
              this.docentesLoading = false;
          }
      });
  }

  onInstructorChange(instructorId: any): void {
      console.log('📝 [DEBUG] Instructor seleccionado:', instructorId, 'Tipo:', typeof instructorId);

      this.currentCourse.instructorId = this.normalizeGuidValue(instructorId);
      
      console.log('📝 [DEBUG] Valor final de instructorId:', this.currentCourse.instructorId, 'Tipo:', typeof this.currentCourse.instructorId);
  }

  private normalizeModules(modules: any[]): any[] {
      return (modules || []).map((m: any, index: number) => ({
          id: m.id ?? `MOD-${Date.now()}-${index}`,
          title: m.title ?? m.titulo ?? `Módulo ${index + 1}`,
          description: m.description ?? m.descripcion ?? '',
          duration: m.duration ?? m.duracion ?? '',
          topics: Array.isArray(m.topics)
              ? m.topics
              : Array.isArray(m.lecciones)
                  ? m.lecciones
                  : [],
          materials: Array.isArray(m.materials) ? m.materials : [],
          isExpanded: m.isExpanded ?? true
      }));
  }

  private normalizeEvaluaciones(evaluaciones: any[]): any[] {
      return (evaluaciones || []).map((e: any) => ({
          ...e,
          tipo: this.normalizeEvaluationType(e.tipo ?? e.tipoEvaluacion),
          nombre: e.nombre ?? e.titulo ?? '',
          peso: e.peso ?? e.puntajeMaximo ?? 0,
          fechaLimite: e.fechaLimite ?? e.fechaFin ?? '',
          preguntas: Array.isArray(e.preguntas) ? e.preguntas : []
      }));
  }

  private normalizeEvaluationType(tipo: any): string {
      const tipoMap: Record<string, string> = {
          '1': 'Examen',
          '2': 'Práctica',
          '3': 'Proyecto',
          '4': 'Quiz',
          'EXAMEN': 'Examen',
          'TAREA': 'Práctica',
          'PROYECTO': 'Proyecto',
          'QUIZ': 'Quiz',
          'QUIZZ': 'Quiz'
      };

      if (tipo === null || tipo === undefined) {
          return 'Examen';
      }

      const normalized = String(tipo).toUpperCase();
      return tipoMap[normalized] || String(tipo);
  }

  closeModal() {
      this.isModalOpen = false;
      this.newModuleTitle = '';
      this.resetEvalForm();
  }

  resetEvalForm() {
      this.newEval = { nombre: '', tipo: 'Examen', peso: 0, fechaLimite: '', preguntas: [] };
      this.isEditingEvaluation = false;
      this.editingEvaluationIndex = -1;
  }

  saveCourse() {
      // Si hay un módulo a medio crear, agregarlo automáticamente
      if (this.newModuleTitle && this.newModuleTitle.trim()) {
          this.addModule();
      }

      // Si hay una evaluación a medio crear o editar, actualizarla
      if (this.newEval.nombre && this.newEval.peso) {
          this.addEvaluation();
      }

      if (this.isEditing) {
          // Primero actualizar el curso
          this.adminService.updateCourse(this.currentCourse).subscribe({
              next: () => {
                  console.log('✅ Curso actualizado, procesando evaluaciones...');
                  
                  // Procesar evaluaciones: crear nuevas o actualizar existentes
                  this.saveEvaluations().then(() => {
                      const index = this.allCourses.findIndex(c => c.id === this.currentCourse.id);
                      if (index !== -1) {
                          this.allCourses[index] = this.currentCourse;
                          this.applyFilters();
                      }
                      this.closeModal();
                      console.log('✅ Curso y evaluaciones guardados exitosamente');
                  });
              },
              error: (err) => {
                  console.error('❌ Error guardando curso:', err);
              }
          });
      } else {
          this.currentCourse.enrolled = 0;
          this.adminService.createCourse(this.currentCourse).subscribe({
              next: (result: any) => {
                  this.currentCourse.id = (typeof result === 'string' ? result : (result?.value ?? result?.id ?? `CRS-${Date.now()}`));
                  this.allCourses.unshift({ ...this.currentCourse });
                  this.applyFilters();
                  this.closeModal();
              },
              error: () => {
                  this.currentCourse.id = `CRS-${Date.now()}`;
                  this.allCourses.unshift({ ...this.currentCourse });
                  this.applyFilters();
                  this.closeModal();
              }
          });
      }
  }
  
  // Guardar evaluaciones en el backend
  async saveEvaluations(): Promise<void> {
      if (!this.currentCourse.evaluaciones || this.currentCourse.evaluaciones.length === 0) {
          console.log('📝 No hay evaluaciones para guardar');
          return;
      }

      console.log('🔍 [DEBUG] Evaluaciones antes de guardar:', this.currentCourse.evaluaciones.map((e: any) => ({
          nombre: e.nombre,
          id: e.id,
          preguntasCount: e.preguntas?.length || 0,
          preguntas: e.preguntas
      })));

      const evaluationsToSave = this.currentCourse.evaluaciones.map(async (evaluacion: any) => {
          const isNewEvaluation = !this.isValidGuid(evaluacion.id);
          
          console.log(`🔍 Evaluación "${evaluacion.nombre}" tiene ${(evaluacion.preguntas || []).length} preguntas totales`);
          
          // Filtrar solo preguntas válidas antes de enviar al backend
          const validQuestions = (evaluacion.preguntas || []).filter((q: any, index: number) => {
              const hasText = q.texto && q.texto.trim().length > 0;
              
              // Filtrar opciones vacías automáticamente
              const opcionesConTexto = (q.opciones || []).filter((o: any) => 
                  o.texto && o.texto.trim().length > 0
              );
              
              const allOptionsValid = opcionesConTexto.length >= 2;
              const hasCorrectAnswer = opcionesConTexto.some((o: any) => o.esCorrecta);
              
              const isValid = hasText && allOptionsValid && hasCorrectAnswer;
              
              if (!isValid) {
                  console.log(`❌ Pregunta ${index + 1} no válida:`, {
                      texto: q.texto || '(vacío)',
                      tieneTexto: hasText,
                      opcionesTotales: q.opciones?.length || 0,
                      opcionesConTexto: opcionesConTexto.length,
                      opcionesValidas: allOptionsValid,
                      tieneRespuestaCorrecta: hasCorrectAnswer,
                      opcionesDetalle: q.opciones?.map((o: any, i: number) => ({
                          indice: i + 1,
                          texto: o.texto || '(VACÍO)',
                          longitud: (o.texto || '').trim().length,
                          esCorrecta: o.esCorrecta
                      }))
                  });
              } else {
                  // Si es válida pero tiene opciones vacías, limpiarlas antes de enviar
                  if (opcionesConTexto.length < q.opciones.length) {
                      q.opciones = opcionesConTexto;
                      console.log(`🧹 Pregunta ${index + 1}: Limpiadas ${q.opciones.length - opcionesConTexto.length} opciones vacías`);
                  }
              }
              
              return isValid;
          });
          
          console.log(`✅ ${validQuestions.length} preguntas válidas de ${(evaluacion.preguntas || []).length} totales`);

          const docenteId = this.normalizeGuidValue(this.currentCourse.instructorId);
          if (!docenteId) {
              console.error('❌ No se puede guardar evaluación: debe asignar un docente válido al curso');
              return;
          }
          
          const evaluationWithCourseId = {
              ...evaluacion,
              cursoId: this.currentCourse.id,
              docenteId: docenteId,
              preguntas: validQuestions // Solo enviar preguntas válidas al backend
          };
          
          console.log('📋 Datos de evaluación a enviar:', {
              docenteId: evaluationWithCourseId.docenteId,
              cursoId: evaluationWithCourseId.cursoId,
              instructorIdOriginal: this.currentCourse.instructorId
          });

          try {
              if (isNewEvaluation) {
                  console.log(`🆕 Creando evaluación: ${evaluacion.nombre} (${validQuestions.length} preguntas)`);
                  const response = await firstValueFrom(this.adminService.createEvaluation(evaluationWithCourseId));
                  // Actualizar ID local con el ID real del backend
                  evaluacion.id = response.id || response.Id || evaluacion.id;
                  console.log('✅ Evaluación creada con ID:', evaluacion.id);
              } else {
                  console.log(`🔄 Actualizando evaluación: ${evaluacion.nombre} (${validQuestions.length} preguntas)`);
                  await firstValueFrom(this.adminService.updateEvaluation(evaluationWithCourseId));
                  console.log('✅ Evaluación actualizada:', evaluacion.id);
                  
                  // Sincronizar preguntas (eliminar viejas y agregar nuevas)
                  if (validQuestions.length > 0) {
                      console.log(`🔄 Sincronizando ${validQuestions.length} preguntas...`);
                      await firstValueFrom(this.adminService.syncEvaluationQuestions(evaluacion.id, validQuestions));
                      console.log('✅ Preguntas sincronizadas');
                  }
              }
          } catch (err) {
              console.error('❌ Error procesando evaluación:', err);
          }
      });

      await Promise.all(evaluationsToSave);
  }
  
  // Module Management
  addModule() {
      if(!this.newModuleTitle.trim()) return;
      
      const newMod = { 
          id: `MOD-${Date.now()}`, 
          title: this.newModuleTitle,
          description: '',
          duration: '',
          topics: [],
          isExpanded: true // Default to expanded when adding
      };
      
      this.currentCourse.modules.push(newMod);
      this.newModuleTitle = '';
  }

  toggleModuleExpand(module: any) {
      module.isExpanded = !module.isExpanded;
  }

  addTopic(module: any, topicInput: HTMLInputElement) {
      const topicName = topicInput.value.trim();
      if (!topicName) return;
      if (!module.topics) module.topics = [];
      
      // Simple string topics as requested, materials are separate now
      module.topics.push(topicName);
      topicInput.value = '';
  }

  // Material Modal
  isMaterialModalOpen = false;
  newMaterialName = '';
  selectedFile: File | null = null;
  currentModuleForMaterial: any = null;

  openAddMaterialModal(module: any) {
      this.currentModuleForMaterial = module;
      this.newMaterialName = '';
      this.selectedFile = null;
      this.isMaterialModalOpen = true;
  }

  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          this.selectedFile = file;
          // Auto-fill name if empty
          if (!this.newMaterialName) {
              this.newMaterialName = file.name;
          }
      }
  }

  confirmAddMaterial() {
      if (!this.newMaterialName || !this.currentModuleForMaterial) return;
      
      let type = 'LINK';
      let url = '#';

      if (this.selectedFile) {
          // Determine type based on extension mock
          const ext = this.selectedFile.name.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') type = 'PDF';
          else if (['mp4', 'mov', 'avi'].includes(ext || '')) type = 'VIDEO';
          else type = 'FILE'; // Generic

          // Create object URL for demo purposes
          url = URL.createObjectURL(this.selectedFile);
      } 

      const newMaterial = {
          id: `MAT-${Date.now()}`,
          title: this.newMaterialName,
          type: type,
          url: url,
          topicRef: null
      };

      if (!this.currentModuleForMaterial.materials) this.currentModuleForMaterial.materials = [];
      this.currentModuleForMaterial.materials.push(newMaterial);
      
      this.isMaterialModalOpen = false;
      this.newMaterialName = '';
      this.selectedFile = null;
      this.currentModuleForMaterial = null;
  }

  // Confirmation Modal (Generic)
  isConfirmModalOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  openConfirmModal(title: string, message: string, action: () => void) {
      this.confirmTitle = title;
      this.confirmMessage = message;
      this.confirmAction = action;
      this.isConfirmModalOpen = true;
  }

  closeConfirmModal() {
      this.isConfirmModalOpen = false;
      this.confirmAction = null;
  }

  executeConfirmAction() {
      if (this.confirmAction) this.confirmAction();
      this.closeConfirmModal();
  }

  // Updated Methods with Confirmation
  removeModule(index: number) {
      this.openConfirmModal(
          'Eliminar Módulo',
          '¿Estás seguro de eliminar este módulo? Se perderán todos los temas y materiales asociados.',
          () => {
             this.currentCourse.modules.splice(index, 1);
          }
      );
  }

  removeTopic(module: any, index: number) {
      // Optional: Confirm topic deletion too, or keep it snappy if preferred. 
      // Given "Replace alerts with modals", explicit action is safer.
      this.openConfirmModal(
          'Eliminar Tema',
          '¿Eliminar este tema?',
          () => {
              module.topics.splice(index, 1);
          }
      );
  }

  addMaterial(module: any) {
      this.openAddMaterialModal(module);
  }

  removeMaterial(module: any, index: number) {
       this.openConfirmModal(
          'Eliminar Material',
          '¿Eliminar este material?',
          () => {
              module.materials.splice(index, 1);
          }
      );
  }

  getMaterialIcon(type: string): string {
      switch(type) {
          case 'PDF': return 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'; // Doc icon
          case 'VIDEO': return 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z'; // Play icon
          case 'LINK': return 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244'; // Link icon
          default: return 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0v5.25m0 0l3-3m-3 3l-3-3';
      }
  }

  // Evaluation Management
  addEvaluation() {
      if (!this.newEval.nombre || !this.newEval.peso) return;
      
      if (this.isEditingEvaluation && this.editingEvaluationIndex >= 0) {
          // Actualizar evaluación existente
          const existingEval = this.currentCourse.evaluaciones[this.editingEvaluationIndex];
          this.currentCourse.evaluaciones[this.editingEvaluationIndex] = {
              ...existingEval,
              nombre: this.newEval.nombre,
              tipo: this.newEval.tipo,
              peso: this.newEval.peso,
              fechaLimite: this.newEval.fechaLimite
          };
          console.log('✅ Evaluación actualizada:', this.currentCourse.evaluaciones[this.editingEvaluationIndex]);
      } else {
          // Crear nueva evaluación
          const newEv = { 
              id: `EV-${Date.now()}`, 
              ...this.newEval, 
              estado: 'Pendiente',
              preguntas: [] // Default empty questions
          };
          this.currentCourse.evaluaciones.push(newEv);
          console.log('✅ Nueva evaluación agregada:', newEv);
      }
      
      this.resetEvalForm();
  }
  
  editEvaluation(evalIndex: number) {
      const evaluacion = this.currentCourse.evaluaciones[evalIndex];
      this.isEditingEvaluation = true;
      this.editingEvaluationIndex = evalIndex;
      
      // Convertir fecha ISO a formato yyyy-MM-dd para input[type="date"]
      let fechaFormatted = '';
      const fechaRaw = evaluacion.fechaLimite || evaluacion.fechaFin || '';
      if (fechaRaw) {
          try {
              const date = new Date(fechaRaw);
              if (!isNaN(date.getTime())) {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const d = String(date.getDate()).padStart(2, '0');
                  fechaFormatted = `${y}-${m}-${d}`;
              }
          } catch (e) {
              console.warn('⚠️ Error parsing date:', fechaRaw);
          }
      }
      
      this.newEval = {
          nombre: evaluacion.nombre || evaluacion.titulo || '',
          tipo: evaluacion.tipo || 'Examen',
          peso: evaluacion.peso || evaluacion.puntajeMaximo || 0,
          fechaLimite: fechaFormatted
      };
      console.log('✏️ Editando evaluación:', evaluacion);
      
      // Scroll al formulario
      setTimeout(() => {
          const formElement = document.querySelector('.evaluation-form');
          if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
      }, 100);
  }
  
  cancelEditEvaluation() {
      this.resetEvalForm();
  }
  
  editQuestionsFromForm() {
      if (this.editingEvaluationIndex >= 0) {
          const evalIndex = this.editingEvaluationIndex;
          // Primero guarda los cambios del formulario
          this.addEvaluation();
          // Luego abre el editor de preguntas con el índice guardado
          setTimeout(() => {
              this.openQuestionEditor(evalIndex);
          }, 100);
      }
  }

  removeEvaluation(index: number) {
      this.openConfirmModal(
          'Eliminar Evaluación',
          '¿Estás seguro de eliminar esta evaluación? Se perderán todas las preguntas asociadas.',
          () => {
              this.currentCourse.evaluaciones.splice(index, 1);
          }
      );
  }
  
  // Question Editor Methods
  openQuestionEditor(evalIndex: number) {
      this.editingEvalIndex = evalIndex;
      const evaluacion = this.currentCourse.evaluaciones[evalIndex];
      
      // Priorizar preguntas locales (permiten edición temporal antes de guardar)
      if (evaluacion.preguntas && evaluacion.preguntas.length > 0) {
          console.log('📝 Usando preguntas locales guardadas:', evaluacion.preguntas.length);
          this.questionsList = JSON.parse(JSON.stringify(evaluacion.preguntas));
          this.showQuestionEditor = true;
          return;
      }
      
      // Verificar si es un ID real del backend (GUID) para cargar preguntas
      const isRealId = evaluacion.id && this.isValidGuid(evaluacion.id);
      
      if (isRealId) {
          console.log('🔍 Cargando preguntas de la evaluación desde backend:', evaluacion.id);
          this.adminService.getEvaluationQuestions(evaluacion.id).subscribe({
              next: (preguntas) => {
                  console.log('✅ Preguntas cargadas del backend:', preguntas.length);
                  this.questionsList = preguntas.length > 0 
                      ? JSON.parse(JSON.stringify(preguntas))  
                      : [this.createEmptyQuestion()];
                  // Guardar en objeto local para futuras ediciones
                  evaluacion.preguntas = this.questionsList;
                  this.showQuestionEditor = true;
              },
              error: (err) => {
                  console.warn('⚠️ Error cargando preguntas, empezando con pregunta vacía:', err.message);
                  this.questionsList = [this.createEmptyQuestion()];
                  this.showQuestionEditor = true;
              }
          });
      } else {
          // Evaluación nueva sin preguntas locales
          console.log('🆕 Evaluación nueva, empezando con pregunta vacía');
          this.questionsList = [this.createEmptyQuestion()];
          this.showQuestionEditor = true;
      }
  }
  
  closeQuestionEditor() {
      this.showQuestionEditor = false;
      this.editingEvalIndex = -1;
      this.questionsList = [];
  }

  getOptionLabel(index: number): string {
      return String.fromCharCode(65 + index); // A, B, C, D, etc.
  }
  
  // Helper para validar si un ID es un GUID real del backend
  isValidGuid(id: string): boolean {
      if (!id) return false;
      // GUIDs tienen formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return guidPattern.test(id);
  }

  private normalizeGuidValue(value: any): string | null {
      const candidate = value?.value ?? value?.Value ?? value?.id ?? value;
      if (candidate === null || candidate === undefined) return null;

      const normalized = String(candidate).trim();
      if (!normalized || normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'undefined') {
          return null;
      }

      return this.isValidGuid(normalized) ? normalized : null;
  }
  
  createEmptyQuestion() {
      return {
          id: `Q-${Date.now()}-${Math.random()}`,
          texto: '',
          puntos: 10,
          explicacion: '',
          opciones: [
              { id: `O-${Date.now()}-1`, texto: '', esCorrecta: true },
              { id: `O-${Date.now()}-2`, texto: '', esCorrecta: false },
              { id: `O-${Date.now()}-3`, texto: '', esCorrecta: false },
              { id: `O-${Date.now()}-4`, texto: '', esCorrecta: false }
          ]
      };
  }
  
  addQuestion() {
      this.questionsList.push(this.createEmptyQuestion());
  }
  
  removeQuestion(qIdx: number) {
      this.openConfirmModal(
          'Eliminar Pregunta',
          '¿Eliminar esta pregunta?',
          () => {
              this.questionsList.splice(qIdx, 1);
          }
      );
  }
  
  setCorrectOption(qIdx: number, oIdx: number) {
      this.questionsList[qIdx].opciones.forEach((o: any, i: number) => {
          o.esCorrecta = (i === oIdx);
      });
  }
  
  addOption(qIdx: number) {
      this.questionsList[qIdx].opciones.push({
          id: `O-${Date.now()}-${Math.random()}`,
          texto: '',
          esCorrecta: false
      });
  }
  
  removeOption(qIdx: number, oIdx: number) {
      const q = this.questionsList[qIdx];
      if (q.opciones.length > 2) {
          q.opciones.splice(oIdx, 1);
      }
  }
  
  saveQuestions() {
      if (this.editingEvalIndex >= 0) {
          console.log('💾 [DEBUG] Guardando preguntas. Índice:', this.editingEvalIndex);
          console.log('💾 [DEBUG] questionsList:', this.questionsList);
          
          // Filtrar preguntas completamente vacías (sin ningún contenido)
          const questionsWithContent = this.questionsList.filter(q => {
              const hasQuestionText = q.texto && q.texto.trim().length > 0;
              const hasAnyOptionText = q.opciones && q.opciones.some((o: any) => o.texto && o.texto.trim().length > 0);
              return hasQuestionText || hasAnyOptionText; // Guardar si tiene al menos algo de contenido
          });
          
          console.log('💾 [DEBUG] Preguntas con contenido:', questionsWithContent.length);
          
          // Guardar preguntas con contenido (incluso si están incompletas) - permite modo borrador
          this.currentCourse.evaluaciones[this.editingEvalIndex].preguntas = 
              JSON.parse(JSON.stringify(questionsWithContent));
          
          console.log('💾 [DEBUG] Preguntas guardadas en evaluación:', 
              this.currentCourse.evaluaciones[this.editingEvalIndex].preguntas);
          
          // Contar preguntas válidas para feedback
          const validQuestions = questionsWithContent.filter(q => {
              const hasText = q.texto && q.texto.trim().length > 0;
              const allOptionsValid = q.opciones && q.opciones.length >= 2 && 
                  q.opciones.every((o: any) => o.texto && o.texto.trim().length > 0);
              const hasCorrectAnswer = q.opciones && q.opciones.some((o: any) => o.esCorrecta);
              
              return hasText && allOptionsValid && hasCorrectAnswer;
          });
          
          this.closeQuestionEditor();
          
          const totalQuestions = questionsWithContent.length;
          const validCount = validQuestions.length;
          const incompleteCount = totalQuestions - validCount;
          
          if (totalQuestions === 0) {
              console.log('📝 No se guardaron preguntas (todas estaban vacías)');
          } else if (validCount === totalQuestions) {
              console.log(`✅ ${validCount} pregunta${validCount !== 1 ? 's' : ''} guardada${validCount !== 1 ? 's' : ''} (todas completas)`);
          } else if (validCount > 0) {
              console.log(`⚠️ ${validCount} completa${validCount !== 1 ? 's' : ''}, ${incompleteCount} incompleta${incompleteCount !== 1 ? 's' : ''} (guardadas como borrador)`);
          } else {
              console.log(`📝 ${totalQuestions} pregunta${totalQuestions !== 1 ? 's' : ''} guardada${totalQuestions !== 1 ? 's' : ''} como borrador (ninguna completa)`);
          }
      }
  }

  openDeleteModal(course: any) {
      this.courseToDelete = course;
      this.isDeleteModalOpen = true;
  }

  confirmDelete() {
      if (this.courseToDelete) {
          this.adminService.deleteCourse(this.courseToDelete.id).subscribe({
              next: () => {
                  this.allCourses = this.allCourses.filter(c => c.id !== this.courseToDelete.id);
                  this.applyFilters();
                  this.isDeleteModalOpen = false;
                  this.courseToDelete = null;
              }
          });
      }
  }

  getPagesArray(): number[] {
      return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  getStatusClass(status: string): string {
      switch (status) {
          case 'PUBLISHED': return 'bg-green-100 text-green-700 border-green-200';
          case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
          case 'ARCHIVED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  }

  getStatusLabel(status: string): string {
      switch(status) {
          case 'PUBLISHED': return 'Publicado';
          case 'DRAFT': return 'Borrador';
          case 'ARCHIVED': return 'Archivado';
          default: return status;
      }
  }
}
