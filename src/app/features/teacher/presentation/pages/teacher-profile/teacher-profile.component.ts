import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { injectQueryClient } from '@tanstack/angular-query-experimental';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TeacherProfile } from '@features/teacher/domain/models/teacher-profile.model';
import { useTeacherInfo, useDashboardStats } from '@features/teacher/infrastructure/queries/teacher-query-hooks';
import { teacherQueryKeys } from '@features/teacher/infrastructure/queries/teacher-query-keys';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-profile.component.html',
  styles: ``,
})
export class TeacherProfileComponent {
  private authRepository = inject(AuthRepository);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private queryClient = injectQueryClient();

  private currentUser = this.authRepository.getCurrentUser();
  private userId = this.currentUser?.id ?? '';

  // TanStack Query hooks
  private teacherInfoQuery = useTeacherInfo(this.userId);
  private statsQuery = useDashboardStats(this.userId);

private profileOverrides = signal<Partial<TeacherProfile>>({});
  isSaving = signal(false);
  saveNotification = signal<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Loading / error
  isLoading = computed(() => this.teacherInfoQuery.isLoading() || this.statsQuery.isLoading());
  isError   = computed(() => this.teacherInfoQuery.isError());

  // Perfil computado unificando info + stats + overrides
  profile = computed<TeacherProfile | null>(() => {
    const info  = this.teacherInfoQuery.data();
    const stats = this.statsQuery.data();
    const ov    = this.profileOverrides();

    if (!info) return null;

    return {
      id:         this.currentUser?.id    ?? '',
      email:      this.currentUser?.email ?? '',
      fullName:   ov.fullName   ?? info.nombre   ?? '',
      role:       (this.currentUser?.role  ?? 'TEACHER') as string,
      bio:        ov.bio        ?? info.bio,
      phone:      ov.phone      ?? undefined,
      department: ov.department ?? undefined,
      cargo:   info.cargo,
      avatar:  info.avatar,
      linkedIn: info.linkedIn,
      stats: stats?.stats ? {
        cursosAsignados:        stats.stats.totalCourses,
        alumnosTotales:         stats.stats.totalStudents,
        promedioGeneral:        stats.stats.averageGrade,
        evaluacionesPendientes: stats.stats.pendingGrades,
      } : undefined,
    };
  });

  // Modal state
  isEditModalOpen = false;
  editForm: FormGroup = this.fb.group({
    fullName:   ['', [Validators.required, Validators.minLength(3)]],
    bio:        ['', [Validators.maxLength(500)]],
    linkedIn:   [''],
    phone:      ['', [Validators.pattern(/^\+?\d{1,3}?\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
    department: [''],
  });

  getInitials(fullName: string): string {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  editProfile(): void {
    const p = this.profile();
    if (p) {
      this.editForm.patchValue({
        fullName:   p.fullName,
        bio:        p.bio        ?? '',
        linkedIn:   p.linkedIn   ?? '',
        phone:      p.phone      ?? '',
        department: p.department ?? '',
      });
    }
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editForm.reset();
  }

  async saveProfile(): Promise<void> {
    if (this.editForm.invalid || this.isSaving()) return;

    const info = this.teacherInfoQuery.data();
    if (!info) return;

    const v = this.editForm.value;
    const body = {
      especialidadId: info.especialidadId,
      nombre:         v.fullName || info.nombre,
      cargo:          info.cargo,
      bio:            v.bio    || info.bio || '',
      avatar:         info.avatar || '',
      linkedIn:       v.linkedIn || info.linkedIn || null,
    };

    this.isSaving.set(true);
    this.saveNotification.set(null);
    try {
      await firstValueFrom(
        this.http.put(`${environment.docentesApiUrl}/docente/${info.id}`, body)
      );
      // Update local overrides immediately
      this.profileOverrides.set({
        fullName:   v.fullName   || undefined,
        bio:        v.bio        || undefined,
        linkedIn:   v.linkedIn   || undefined,
        phone:      v.phone      || undefined,
        department: v.department || undefined,
      });
      // Invalidate TanStack Query cache so header/other components refresh
      await this.queryClient.invalidateQueries({ queryKey: teacherQueryKeys.info(this.userId) });
      this.closeEditModal();
      this.saveNotification.set({ type: 'success', msg: 'Perfil actualizado correctamente' });
      setTimeout(() => this.saveNotification.set(null), 3500);
    } catch (err) {
      console.error('❌ [PROFILE] Error saving profile:', err);
      this.saveNotification.set({ type: 'error', msg: 'Error al guardar. Intente nuevamente.' });
      setTimeout(() => this.saveNotification.set(null), 4000);
    } finally {
      this.isSaving.set(false);
    }
  }

  get bioCharCount(): number {
    return this.editForm.get('bio')?.value?.length || 0;
  }
}
