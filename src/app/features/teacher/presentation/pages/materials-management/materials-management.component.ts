import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-materials-management',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gestión de Materiales</h1>
            <p class="text-gray-600 dark:text-gray-400">Materiales del curso - Próximamente</p>
        </div>
    `
})
export class MaterialsManagementComponent {}
