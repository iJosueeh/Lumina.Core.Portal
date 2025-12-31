import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-teacher-schedule',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mi Horario</h1>
            <p class="text-gray-600 dark:text-gray-400">Horario de clases - Próximamente</p>
        </div>
    `
})
export class TeacherScheduleComponent {}
