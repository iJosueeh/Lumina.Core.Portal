import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';

// Services
import { AdminCourseService } from '@features/admin/infrastructure/services/admin-course.service';

// Shared Components
import { ClassroomPlayerComponent } from '@shared/components/features/classroom/classroom-player/classroom-player.component';
import { ClassroomPlaylistComponent, ClassroomLesson } from '@shared/components/features/classroom/classroom-playlist/classroom-playlist.component';
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
    AddModuleModalComponent,
    AddContentModalComponent
  ],
  templateUrl: './course-content-editor.html',
  styles: [`:host { display: block; min-height: 100vh; }`]
})
export class CourseContentEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminCourseService);
  private sanitizer = inject(DomSanitizer);

  courseId = signal('');
  selectedLessonId = signal<string | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploadingImage = signal(false);

  classroomData = signal<any>(null);

  showAddModuleModal = signal(false);
  showAddContentModal = signal(false);
  editingModule = signal<{id: string, titulo: string, descripcion: string} | null>(null);
  editingLeccion = signal<Leccion | null>(null);
  activeModuloId = signal<string>('');

  /** Cover image URL — updated live after upload */
  courseImageUrl = signal('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop');

  sections = computed(() => this.classroomData()?.sections || []);
  allLessons = computed(() => this.sections().flatMap((s: any) => s.videos));

  activeLesson = computed(() => {
    const all = this.allLessons();
    const selected = this.selectedLessonId();
    return all.find((v: any) => v.lessonId === selected) || all[0] || null;
  });

  /** Safe URL for PDF iframe embedding */
  safePdfUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.activeLesson();
    if (!lesson?.videoUrl || lesson.tipo !== 'lectura' || !this.isPdfUrl(lesson.videoUrl)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(lesson.videoUrl);
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
      if (data?.courseImageUrl) {
        this.courseImageUrl.set(data.courseImageUrl);
      }
    } catch {
      this.classroomData.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  isPdfUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
  }

  /** Upload course cover image */
  onCourseImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      input.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe exceder 5MB');
      input.value = '';
      return;
    }

    this.isUploadingImage.set(true);

    this.adminService.uploadCourseImage(file).subscribe({
      next: (url) => {
        this.courseImageUrl.set(url);
        // Persist to backend
        this.adminService.updateCourseImage(this.courseId(), url).subscribe({
          next: () => this.isUploadingImage.set(false),
          error: () => {
            this.isUploadingImage.set(false);
            alert('Imagen subida pero no se pudo guardar. Intenta de nuevo.');
          }
        });
      },
      error: () => {
        this.isUploadingImage.set(false);
        alert('Error al subir la imagen');
      }
    });

    input.value = '';
  }

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
    const section = this.sections().find((s: any) => s.videos.some((v: any) => v.lessonId === lesson.lessonId));
    this.activeModuloId.set(section?.id || section?.title || '');

    this.editingLeccion.set({
      id: lesson.lessonId,
      titulo: lesson.title,
      videoUrl: lesson.videoUrl,
      duracion: lesson.duration,
      descripcion: lesson.description || '',
      tipo: lesson.tipo || 'video'
    } as any);
    this.showAddContentModal.set(true);
  }

  // --- Module CRUD ---

  handleModuleCreated(data: {titulo: string, descripcion: string}): void {
    this.adminService.createModule(this.courseId(), data.titulo, data.descripcion).subscribe({
      next: () => { this.showAddModuleModal.set(false); this.loadClassroomData(); },
      error: () => alert('Error al crear la sección')
    });
  }

  handleModuleUpdated(data: {id: string, titulo: string, descripcion: string}): void {
    this.adminService.updateModule(this.courseId(), data.id, data.titulo, data.descripcion).subscribe({
      next: () => { this.showAddModuleModal.set(false); this.loadClassroomData(); },
      error: () => alert('Error al actualizar la sección')
    });
  }

  handleModuleDeleted(moduleId: string): void {
    this.adminService.deleteModule(this.courseId(), moduleId).subscribe({
      next: () => { this.showAddModuleModal.set(false); this.loadClassroomData(); },
      error: () => alert('Error al eliminar la sección')
    });
  }

  onLessonSaved(): void {
    this.showAddContentModal.set(false);
    this.loadClassroomData();
  }

  handleEditVideo(): void {
    const lesson = this.activeLesson();
    if (lesson) this.openEditLesson(lesson);
  }

  handleUploadVideo(file: File): void {
    const lesson = this.activeLesson();
    if (!lesson) return;

    this.adminService.uploadVideo(file).subscribe({
      next: (url) => {
        this.updateLessonData(lesson.lessonId, { videoUrl: url });
      }
    });
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
