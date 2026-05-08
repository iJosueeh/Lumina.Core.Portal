import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

// Services & Infrastructure
import { AdminCourseService } from '@features/admin/infrastructure/services/admin-course.service';

// Shared Components
import { ClassroomPlayerComponent } from '@shared/components/features/classroom/classroom-player/classroom-player.component';
import { ClassroomPlaylistComponent, ClassroomLesson } from '@shared/components/features/classroom/classroom-playlist/classroom-playlist.component';
import { ClassroomHeaderComponent } from '@shared/components/features/classroom/classroom-header/classroom-header.component';
import { SkeletonLoaderComponent } from '@shared/components/ui/skeleton-loader/skeleton-loader.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

import { AddModuleModalComponent } from '@shared/components/modals/add-module-modal/add-module-modal.component';
import { AddContentModalComponent } from '@shared/components/modals/add-content-modal/add-content-modal.component';
import { Leccion } from '@shared/models/course-management.models';

@Component({
  selector: 'app-course-content-editor',
  standalone: true,
  imports: [
    CommonModule,
    ClassroomPlayerComponent,
    ClassroomPlaylistComponent,
    ClassroomHeaderComponent,
    SkeletonLoaderComponent,
    ButtonComponent,
    AddModuleModalComponent,
    AddContentModalComponent
  ],
  templateUrl: './course-content-editor.html',
  styles: [`
    :host { display: block; background-color: #020617; min-height: 100vh; }
  `]
})
export class CourseContentEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminCourseService);

  courseId = signal('');
  selectedLessonId = signal<string | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploading = signal(false);
  
  classroomData = signal<any>(null);

  // Modal States
  showAddModuleModal = signal(false);
  showAddContentModal = signal(false);
  editingModule = signal<{id: string, titulo: string, descripcion: string} | null>(null);
  editingLeccion = signal<Leccion | null>(null);
  activeModuloId = signal<string>('');
  
  sections = computed(() => this.classroomData()?.sections || []);
  allLessons = computed(() => this.sections().flatMap((s: any) => s.videos));
  
  activeLesson = computed(() => {
    const all = this.allLessons();
    const selected = this.selectedLessonId();
    return all.find((v: any) => v.lessonId === selected) || all[0] || null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadClassroomData();
    }
  }

  async loadClassroomData() {
    this.isLoading.set(true);
    try {
      const data = await lastValueFrom(this.adminService.getAdminClassroom(this.courseId()));
      this.classroomData.set(data);
    } catch (error) {
      console.error('Error loading classroom data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleSaveAll(): void {
    this.isSaving.set(true);
    this.adminService.saveClassroom(this.courseId(), this.sections()).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('✅ ¡Todos los cambios han sido guardados en MongoDB!');
      },
      error: () => {
        this.isSaving.set(false);
        alert('❌ Error al guardar los cambios.');
      }
    });
  }

  // --- Modal Launchers ---

  openAddModule(): void {
    this.editingModule.set(null);
    this.showAddModuleModal.set(true);
  }

  openEditModule(sectionTitle: string): void {
    const section = this.sections().find((s: any) => s.title === sectionTitle);
    if (section) {
      this.editingModule.set({
        id: section.id || section.title,
        titulo: section.title,
        descripcion: section.description || ''
      });
      this.showAddModuleModal.set(true);
    }
  }

  openAddLesson(sectionTitle: string): void {
    const section = this.sections().find((s: any) => s.title === sectionTitle);
    this.activeModuloId.set(section?.id || sectionTitle);
    this.editingLeccion.set(null);
    this.showAddContentModal.set(true);
  }

  openEditLesson(lesson: any): void {
    // Buscar el moduloId de la lección
    const section = this.sections().find((s: any) => s.videos.some((v: any) => v.lessonId === lesson.lessonId));
    this.activeModuloId.set(section?.id || section?.title || '');
    
    this.editingLeccion.set({
      id: lesson.lessonId,
      titulo: lesson.title,
      videoUrl: lesson.videoUrl,
      duracion: lesson.duration,
      descripcion: lesson.description || '',
      tipo: 'video'
    } as any);
    this.showAddContentModal.set(true);
  }

  // --- Event Handlers ---

  handleModuleCreated(data: {titulo: string, descripcion: string}): void {
    const current = this.classroomData();
    const newSection = {
      id: crypto.randomUUID(),
      title: data.titulo,
      description: data.descripcion,
      videos: []
    };
    this.classroomData.set({
      ...current,
      sections: [...current.sections, newSection]
    });
    this.showAddModuleModal.set(false);
  }

  handleModuleUpdated(data: {id: string, titulo: string, descripcion: string}): void {
    const current = this.classroomData();
    const updatedSections = current.sections.map((s: any) => 
      (s.id === data.id || s.title === data.id) 
        ? { ...s, title: data.titulo, description: data.descripcion } 
        : s
    );
    this.classroomData.set({ ...current, sections: updatedSections });
    this.showAddModuleModal.set(false);
  }

  handleModuleDeleted(moduleId: string): void {
    const current = this.classroomData();
    const updatedSections = current.sections.filter((s: any) => s.id !== moduleId && s.title !== moduleId);
    this.classroomData.set({ ...current, sections: updatedSections });
    this.showAddModuleModal.set(false);
  }

  onLessonSaved(): void {
    // Como el shared modal actualiza SQL, recargamos el classroom para ver el estado real (MongoDB sincronizado)
    // Opcional: Podríamos actualizar localmente si confiamos en el éxito del modal
    this.loadClassroomData();
    this.showAddContentModal.set(false);
  }

  // --- Legacy UI Handlers (Refactored or kept for direct input) ---

  handleEditVideo(): void {
    const lesson = this.activeLesson();
    if (lesson) this.openEditLesson(lesson);
  }

  handleUploadVideo(file: File): void {
    const lesson = this.activeLesson();
    if (!lesson) return;

    this.isUploading.set(true);
    this.adminService.uploadVideo(file).subscribe({
      next: (url) => {
        this.updateLessonData(lesson.lessonId, { videoUrl: url });
        this.isUploading.set(false);
      },
      error: () => {
        this.isUploading.set(false);
      }
    });
  }

  handleInputTitle(event: any): void {
    const lesson = this.activeLesson();
    if (lesson) {
      this.updateLessonData(lesson.lessonId, { title: event.target.value });
    }
  }

  handleInputUrl(event: any): void {
    const lesson = this.activeLesson();
    if (lesson) {
      this.updateLessonData(lesson.lessonId, { videoUrl: event.target.value });
    }
  }

  private updateLessonData(lessonId: string, changes: Partial<ClassroomLesson>): void {
    const current = this.classroomData();
    if (!current) return;
    const updated = {
      ...current,
      sections: current.sections.map((s: any) => ({
        ...s,
        videos: s.videos.map((v: any) => v.lessonId === lessonId ? { ...v, ...changes } : v)
      }))
    };
    this.classroomData.set(updated);
  }

  goBack(): void { this.router.navigate(['/admin/courses']); }
}
