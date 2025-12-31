import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CoursesRepository } from '@features/student/domain/repositories/courses.repository';
import { CourseProgress } from '@features/student/domain/models/course-progress.model';

@Injectable({
    providedIn: 'root'
})
export class CoursesMockRepositoryImpl extends CoursesRepository {

    private mockCourses: CourseProgress[] = [
        {
            id: '1',
            titulo: 'Desarrollo Web Full Stack',
            categoria: 'PROGRAMACIÓN',
            moduloActual: 'Módulo 4: React Avanzado',
            progreso: 75,
            ultimoAcceso: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2h
            imagenUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
            colorCategoria: 'blue'
        },
        {
            id: '2',
            titulo: 'Introducción a Python',
            categoria: 'BACKEND',
            moduloActual: 'Módulo 2: Estructuras de Datos',
            progreso: 30,
            ultimoAcceso: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
            imagenUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
            colorCategoria: 'yellow'
        },
        {
            id: '3',
            titulo: 'Bases de Datos SQL',
            categoria: 'BASES DE DATOS',
            moduloActual: 'Módulo 1: Fundamentos Relacionales',
            progreso: 10,
            ultimoAcceso: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
            imagenUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
            colorCategoria: 'green'
        }
    ];

    override getStudentCourses(studentId: string): Observable<CourseProgress[]> {
        // Simular delay de API
        return of(this.mockCourses).pipe(delay(500));
    }
}
