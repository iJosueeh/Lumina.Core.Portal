import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CourseDetail, Module, Lesson } from '@features/student/domain/models/course-detail.model';
import { Assignment } from '@features/student/domain/models/assignment.model';

type TabType = 'description' | 'content' | 'materials' | 'forum' | 'announcements' | 'grades';

@Component({
    selector: 'app-course-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './course-detail.component.html',
    styles: ``
})
export class CourseDetailComponent implements OnInit {
    activeTab: TabType = 'content';
    courseId: string = '';

    tabs = [
        { id: 'description' as TabType, label: 'Descripción', icon: 'document' },
        { id: 'content' as TabType, label: 'Contenido', icon: 'book' },
        { id: 'materials' as TabType, label: 'Materiales', icon: 'folder' },
        { id: 'forum' as TabType, label: 'Foro', icon: 'chat' },
        { id: 'announcements' as TabType, label: 'Anuncios', icon: 'megaphone' },
        { id: 'grades' as TabType, label: 'Calificaciones', icon: 'chart' }
    ];

    course: CourseDetail = {
        id: '1',
        title: 'Desarrollo Web Full Stack',
        instructor: {
            name: 'Carlos Mendoza',
            title: 'Ingeniero de Software Senior @ TechCorp',
            avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff'
        },
        semester: 'Semestre 2024-1',
        progress: 45,
        completedModules: 14,
        totalModules: 18,
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
        modules: [
            {
                id: 'm1',
                title: 'Módulo 1: Fundamentos de la Web',
                duration: '1h 30m',
                isExpanded: false,
                lessons: [
                    { id: 'l1', title: '1.1 Introducción a HTML5', type: 'video', duration: '15 min', isCompleted: true, isLocked: false },
                    { id: 'l2', title: '1.2 Estructura Semántica', type: 'reading', duration: '10 min', isCompleted: true, isLocked: false }
                ]
            },
            {
                id: 'm2',
                title: 'Módulo 2: CSS Moderno y Flexbox',
                duration: '2h 35m',
                isExpanded: true,
                lessons: [
                    { id: 'l3', title: '2.1 Selectores Avanzados', type: 'video', duration: '20 min', isCompleted: true, isLocked: false },
                    { id: 'l4', title: '2.2 Modelo de Caja (Box Model)', type: 'video', duration: '25 min', isCompleted: false, isLocked: false },
                    { id: 'l5', title: '2.3 Flexbox Fundamentales', type: 'video', duration: '30 min', isCompleted: false, isLocked: true, availableIn: 'Vence: 2 días' },
                    { id: 'l6', title: '2.4 Quiz: Conceptos de CSS', type: 'quiz', duration: '15 min', isCompleted: false, isLocked: true }
                ]
            },
            {
                id: 'm3',
                title: 'Módulo 3: JavaScript Básico',
                duration: '4h 00m',
                isExpanded: false,
                lessons: [
                    { id: 'l7', title: '3.1 Variables y Tipos de Datos', type: 'video', duration: '30 min', isCompleted: false, isLocked: true },
                    { id: 'l8', title: '3.2 Funciones y Scope', type: 'video', duration: '40 min', isCompleted: false, isLocked: true }
                ]
            }
        ]
    };

    upcomingAssignments: Assignment[] = [
        {
            id: '1',
            titulo: 'Proyecto: Landing Page',
            cursoNombre: 'Desarrollo Web Full Stack',
            fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            esUrgente: false,
            mes: 'OCT',
            dia: 15
        },
        {
            id: '2',
            titulo: 'Quiz: Modelo de Caja',
            cursoNombre: 'Desarrollo Web Full Stack',
            fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            esUrgente: false,
            mes: 'OCT',
            dia: 22
        }
    ];

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.courseId = this.route.snapshot.params['id'] || '1';
        // Aquí cargarías los datos del curso desde el backend
    }

    setTab(tab: TabType): void {
        this.activeTab = tab;
    }

    toggleModule(module: Module): void {
        module.isExpanded = !module.isExpanded;
    }

    getLessonIcon(type: string): string {
        const icons: Record<string, string> = {
            'video': 'play-circle',
            'reading': 'document-text',
            'quiz': 'clipboard-document-check',
            'assignment': 'pencil-square'
        };
        return icons[type] || 'document';
    }

    startLesson(lesson: Lesson): void {
        if (!lesson.isLocked) {
            console.log('Starting lesson:', lesson.title);
            // Navegar a la lección
        }
    }
}
