import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  CourseDetail,
  Module,
  Lesson,
  CourseMaterial,
  MaterialType,
  Forum,
  ForumPost,
  ForumComment,
  Announcement,
  AnnouncementAttachment,
  CourseGrade,
  Evaluation,
} from '@features/student/domain/models/course-detail.model';
import { Assignment } from '@features/student/domain/models/assignment.model';

type TabType = 'description' | 'content' | 'materials' | 'forum' | 'announcements' | 'grades';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-detail.component.html',
  styles: ``,
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
    { id: 'grades' as TabType, label: 'Calificaciones', icon: 'chart' },
  ];

  course: CourseDetail = {
    id: '1',
    title: 'Desarrollo Web Full Stack',
    instructor: {
      name: 'Carlos Mendoza',
      title: 'Ingeniero de Software Senior @ TechCorp',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
      bio: 'Ingeniero de Software con más de 10 años de experiencia en desarrollo web. Apasionado por enseñar y compartir conocimientos con la comunidad de desarrolladores.',
      experience:
        'Senior Software Engineer en TechCorp (5 años), Full Stack Developer en StartupXYZ (3 años), Frontend Developer en WebAgency (2 años)',
      education:
        'Maestría en Ciencias de la Computación - Universidad Nacional, Ingeniería de Sistemas - Universidad Tecnológica',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/carlosmendoza',
        github: 'https://github.com/carlosmendoza',
        twitter: 'https://twitter.com/carlosdev',
        website: 'https://carlosmendoza.dev',
      },
    },
    semester: 'Semestre 2024-1',
    progress: 45,
    completedModules: 14,
    totalModules: 18,
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',

    // Descripción
    description:
      'Aprende a desarrollar aplicaciones web modernas desde cero. Este curso te llevará desde los fundamentos de HTML, CSS y JavaScript hasta frameworks avanzados como React y Node.js. Construirás proyectos reales y aprenderás las mejores prácticas de la industria.',
    learningObjectives: [
      'Dominar los fundamentos de HTML5, CSS3 y JavaScript moderno',
      'Crear interfaces de usuario responsivas y atractivas',
      'Desarrollar aplicaciones web con React y sus ecosistemas',
      'Construir APIs RESTful con Node.js y Express',
      'Implementar bases de datos con MongoDB y PostgreSQL',
      'Aplicar principios de diseño y arquitectura de software',
      'Desplegar aplicaciones en la nube (AWS, Heroku, Vercel)',
    ],
    whatYouWillLearn: [
      'HTML5 semántico y accesibilidad web',
      'CSS3 avanzado: Flexbox, Grid, Animaciones',
      'JavaScript ES6+: Async/Await, Promises, Modules',
      'React: Hooks, Context API, React Router',
      'Node.js y Express para backend',
      'Bases de datos SQL y NoSQL',
      'Autenticación y autorización (JWT, OAuth)',
      'Testing con Jest y React Testing Library',
      'Git y GitHub para control de versiones',
      'Metodologías ágiles y trabajo en equipo',
    ],
    requirements: [
      'Conocimientos básicos de programación (cualquier lenguaje)',
      'Computadora con Windows, Mac o Linux',
      'Editor de código (VS Code recomendado)',
      'Conexión a internet estable',
      'Ganas de aprender y dedicación de 10-15 horas semanales',
    ],
    level: 'Intermedio',

    // Información del curso
    modality: 'Híbrido',
    schedule: 'Lunes y Miércoles 18:00 - 21:00',
    credits: 4,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-07-30'),
    totalDuration: '120 horas',
    totalLessons: 85,
    resources: [
      'Videos HD descargables',
      'Código fuente de todos los proyectos',
      'Slides de presentación',
      'Ejercicios prácticos',
      'Proyecto final integrador',
      'Certificado de finalización',
    ],

    modules: [
      {
        id: 'm1',
        title: 'Módulo 1: Fundamentos de la Web',
        duration: '1h 30m',
        isExpanded: false,
        lessons: [
          {
            id: 'l1',
            title: '1.1 Introducción a HTML5',
            type: 'video',
            duration: '15 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'l2',
            title: '1.2 Estructura Semántica',
            type: 'reading',
            duration: '10 min',
            isCompleted: true,
            isLocked: false,
          },
        ],
      },
      {
        id: 'm2',
        title: 'Módulo 2: CSS Moderno y Flexbox',
        duration: '2h 35m',
        isExpanded: true,
        lessons: [
          {
            id: 'l3',
            title: '2.1 Selectores Avanzados',
            type: 'video',
            duration: '20 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'l4',
            title: '2.2 Modelo de Caja (Box Model)',
            type: 'video',
            duration: '25 min',
            isCompleted: false,
            isLocked: false,
          },
          {
            id: 'l5',
            title: '2.3 Flexbox Fundamentales',
            type: 'video',
            duration: '30 min',
            isCompleted: false,
            isLocked: true,
            availableIn: 'Vence: 2 días',
          },
          {
            id: 'l6',
            title: '2.4 Quiz: Conceptos de CSS',
            type: 'quiz',
            duration: '15 min',
            isCompleted: false,
            isLocked: true,
          },
        ],
      },
      {
        id: 'm3',
        title: 'Módulo 3: JavaScript Básico',
        duration: '4h 00m',
        isExpanded: false,
        lessons: [
          {
            id: 'l7',
            title: '3.1 Variables y Tipos de Datos',
            type: 'video',
            duration: '30 min',
            isCompleted: false,
            isLocked: true,
          },
          {
            id: 'l8',
            title: '3.2 Funciones y Scope',
            type: 'video',
            duration: '40 min',
            isCompleted: false,
            isLocked: true,
          },
        ],
      },
    ],

    // Materiales del curso
    materials: [
      // Módulo 1: Fundamentos de la Web
      {
        id: 'mat-1-1',
        title: 'Video: Introducción a HTML5',
        type: 'video',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        lessonId: 'l1',
        lessonName: '1.1 Introducción a HTML5',
        description: 'Grabación completa de la clase introductoria sobre HTML5',
        url: 'https://example.com/videos/html5-intro.mp4',
        fileSize: '120 MB',
        duration: '45 min',
        isViewed: true,
        uploadDate: new Date('2024-03-16'),
        downloadCount: 45,
      },
      {
        id: 'mat-1-2',
        title: 'Slides: HTML Semántico',
        type: 'pdf',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        lessonId: 'l2',
        lessonName: '1.2 Estructura Semántica',
        description: 'Presentación sobre etiquetas semánticas de HTML5',
        url: 'https://example.com/slides/html-semantico.pdf',
        fileSize: '2.5 MB',
        isViewed: true,
        uploadDate: new Date('2024-03-17'),
        downloadCount: 52,
      },
      {
        id: 'mat-1-3',
        title: 'Código: Ejemplos HTML',
        type: 'code',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        description: 'Archivos de ejemplo con código HTML',
        url: 'https://example.com/code/html-examples.zip',
        fileSize: '1.2 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-18'),
        downloadCount: 38,
      },
      {
        id: 'mat-1-4',
        title: 'Guía de CSS3',
        type: 'pdf',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        description: 'Guía completa de CSS3 con ejemplos',
        url: 'https://example.com/guides/css3-guide.pdf',
        fileSize: '3.8 MB',
        isViewed: true,
        uploadDate: new Date('2024-03-19'),
        downloadCount: 41,
      },
      {
        id: 'mat-1-5',
        title: 'Código: Ejemplos Flexbox',
        type: 'code',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        description: 'Proyectos de ejemplo usando Flexbox',
        url: 'https://example.com/code/flexbox-examples.zip',
        fileSize: '800 KB',
        isViewed: false,
        uploadDate: new Date('2024-03-20'),
        downloadCount: 29,
      },

      // Módulo 2: CSS Moderno y Flexbox
      {
        id: 'mat-2-1',
        title: 'Video: Selectores Avanzados',
        type: 'video',
        moduleId: 'm2',
        moduleName: 'Módulo 2: CSS Moderno y Flexbox',
        lessonId: 'l3',
        lessonName: '2.1 Selectores Avanzados',
        description: 'Clase sobre selectores CSS avanzados',
        url: 'https://example.com/videos/css-selectors.mp4',
        fileSize: '95 MB',
        duration: '35 min',
        isViewed: true,
        uploadDate: new Date('2024-03-22'),
        downloadCount: 34,
      },
      {
        id: 'mat-2-2',
        title: 'Cheatsheet: CSS Grid',
        type: 'pdf',
        moduleId: 'm2',
        moduleName: 'Módulo 2: CSS Moderno y Flexbox',
        description: 'Guía rápida de CSS Grid',
        url: 'https://example.com/cheatsheets/css-grid.pdf',
        fileSize: '1.5 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-23'),
        downloadCount: 27,
      },
      {
        id: 'mat-2-3',
        title: 'Enlace: CSS Tricks - Flexbox',
        type: 'link',
        moduleId: 'm2',
        moduleName: 'Módulo 2: CSS Moderno y Flexbox',
        description: 'Guía completa de Flexbox en CSS Tricks',
        url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
        isViewed: false,
        uploadDate: new Date('2024-03-24'),
      },

      // Módulo 3: JavaScript Básico
      {
        id: 'mat-3-1',
        title: 'Video: Variables y Tipos de Datos',
        type: 'video',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        lessonId: 'l7',
        lessonName: '3.1 Variables y Tipos de Datos',
        description: 'Introducción a variables en JavaScript',
        url: 'https://example.com/videos/js-variables.mp4',
        fileSize: '110 MB',
        duration: '50 min',
        isViewed: false,
        uploadDate: new Date('2024-03-26'),
        downloadCount: 18,
      },
      {
        id: 'mat-3-2',
        title: 'Cheatsheet: JavaScript ES6+',
        type: 'pdf',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        description: 'Referencia rápida de ES6+',
        url: 'https://example.com/cheatsheets/es6-plus.pdf',
        fileSize: '2.1 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-27'),
        downloadCount: 15,
      },
      {
        id: 'mat-3-3',
        title: 'Código: Ejercicios JavaScript',
        type: 'code',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        description: 'Ejercicios prácticos de JavaScript',
        url: 'https://example.com/code/js-exercises.zip',
        fileSize: '3.2 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-28'),
        downloadCount: 12,
      },
      {
        id: 'mat-3-4',
        title: 'Enlace: MDN JavaScript Guide',
        type: 'link',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        description: 'Documentación oficial de JavaScript en MDN',
        url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide',
        isViewed: false,
        uploadDate: new Date('2024-03-29'),
      },
      {
        id: 'mat-3-5',
        title: 'Documento: Buenas Prácticas JS',
        type: 'document',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        description: 'Guía de buenas prácticas en JavaScript',
        url: 'https://example.com/docs/js-best-practices.docx',
        fileSize: '1.8 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-30'),
        downloadCount: 10,
      },
    ],

    // Foros del curso
    forums: [
      {
        id: 'forum-1',
        title: 'Foro General del Curso',
        description: 'Discusiones generales sobre el curso y temas relacionados',
        type: 'general',
        isActive: true,
        postCount: 8,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
        createdBy: 'instructor-1',
        createdAt: new Date('2024-03-15'),
      },
      {
        id: 'forum-2',
        title: 'Módulo 1: Fundamentos de la Web',
        description: 'Preguntas y discusiones sobre HTML y CSS',
        type: 'module',
        moduleId: 'm1',
        moduleName: 'Módulo 1: Fundamentos de la Web',
        isActive: true,
        postCount: 5,
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hace 1 día
        createdBy: 'instructor-1',
        createdAt: new Date('2024-03-16'),
      },
      {
        id: 'forum-3',
        title: 'Módulo 2: CSS Moderno y Flexbox',
        description: 'Dudas sobre CSS Grid, Flexbox y diseño responsive',
        type: 'module',
        moduleId: 'm2',
        moduleName: 'Módulo 2: CSS Moderno y Flexbox',
        isActive: true,
        postCount: 3,
        lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // hace 3 días
        createdBy: 'instructor-1',
        createdAt: new Date('2024-03-20'),
      },
      {
        id: 'forum-4',
        title: 'Módulo 3: JavaScript Básico',
        description: 'Consultas sobre JavaScript y programación',
        type: 'module',
        moduleId: 'm3',
        moduleName: 'Módulo 3: JavaScript Básico',
        isActive: true,
        postCount: 2,
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 1 semana
        createdBy: 'instructor-1',
        createdAt: new Date('2024-03-25'),
      },
    ],

    // Posts de los foros
    forumPosts: [
      // Foro General
      {
        id: 'post-1',
        forumId: 'forum-1',
        title: 'Bienvenidos al curso de Desarrollo Web',
        content:
          'Hola a todos! Bienvenidos al curso. En este foro podrán hacer preguntas generales, compartir recursos y ayudarse mutuamente. Les deseo mucho éxito!',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        createdAt: new Date('2024-03-15'),
        likes: 24,
        commentCount: 5,
        isPinned: true,
        isResolved: false,
        tags: ['bienvenida', 'general'],
      },
      {
        id: 'post-2',
        forumId: 'forum-1',
        title: '¿Cómo organizar mi tiempo de estudio?',
        content:
          'Hola! Trabajo tiempo completo y me cuesta organizar mi tiempo. ¿Algún consejo para balancear trabajo y estudio?',
        author: {
          id: 'student-1',
          name: 'María García',
          avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=10b981&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 8,
        commentCount: 4,
        isPinned: false,
        isResolved: false,
      },
      {
        id: 'post-3',
        forumId: 'forum-1',
        title: 'Recursos adicionales recomendados',
        content:
          'Quiero compartir algunos recursos que me han ayudado mucho: MDN Web Docs, freeCodeCamp, y CSS-Tricks. ¿Qué otros recomiendan?',
        author: {
          id: 'student-2',
          name: 'Juan Pérez',
          avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=f59e0b&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        likes: 12,
        commentCount: 6,
        isPinned: false,
        isResolved: false,
      },

      // Foro Módulo 1
      {
        id: 'post-4',
        forumId: 'forum-2',
        title: '¿Cuál es la diferencia entre <div> y <section>?',
        content:
          'Estoy confundido sobre cuándo usar div y cuándo section. ¿Alguien puede explicar?',
        author: {
          id: 'student-3',
          name: 'Ana López',
          avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=8b5cf6&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        likes: 5,
        commentCount: 3,
        isPinned: false,
        isResolved: true,
      },
      {
        id: 'post-5',
        forumId: 'forum-2',
        title: 'Mejores prácticas de HTML semántico',
        content:
          'Les comparto un artículo sobre HTML semántico y accesibilidad. Es importante usar las etiquetas correctas para mejorar el SEO y la accesibilidad.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        likes: 15,
        commentCount: 2,
        isPinned: true,
        isResolved: false,
        tags: ['html', 'semántica', 'accesibilidad'],
      },

      // Foro Módulo 2
      {
        id: 'post-6',
        forumId: 'forum-3',
        title: 'Problema con Flexbox - elementos no se alinean',
        content:
          'Tengo un problema con Flexbox. Los elementos no se alinean como espero. Adjunto mi código...',
        author: {
          id: 'student-4',
          name: 'Pedro Martínez',
          avatar: 'https://ui-avatars.com/api/?name=Pedro+Martinez&background=ef4444&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        likes: 3,
        commentCount: 4,
        isPinned: false,
        isResolved: true,
      },

      // Foro Módulo 3
      {
        id: 'post-7',
        forumId: 'forum-4',
        title: '¿Cómo funcionan las promesas en JavaScript?',
        content:
          'Estoy aprendiendo sobre async/await pero no entiendo bien las promesas. ¿Alguien puede explicar con un ejemplo simple?',
        author: {
          id: 'student-5',
          name: 'Laura Sánchez',
          avatar: 'https://ui-avatars.com/api/?name=Laura+Sanchez&background=ec4899&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        likes: 6,
        commentCount: 5,
        isPinned: false,
        isResolved: false,
      },
    ],

    // Comentarios de los posts
    forumComments: [
      // Comentarios del post-1 (Bienvenida)
      {
        id: 'comment-1',
        postId: 'post-1',
        content: 'Gracias profesor! Muy emocionado de comenzar este curso.',
        author: {
          id: 'student-1',
          name: 'María García',
          avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=10b981&color=fff',
          role: 'student',
        },
        createdAt: new Date('2024-03-15T10:00:00'),
        likes: 3,
        replies: [],
      },
      {
        id: 'comment-2',
        postId: 'post-1',
        content: 'Bienvenidos a todos! Espero que podamos ayudarnos mutuamente.',
        author: {
          id: 'student-2',
          name: 'Juan Pérez',
          avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=f59e0b&color=fff',
          role: 'student',
        },
        createdAt: new Date('2024-03-15T11:00:00'),
        likes: 2,
        replies: [
          {
            id: 'comment-2-1',
            postId: 'post-1',
            parentCommentId: 'comment-2',
            content: 'Claro que sí! Estamos para apoyarnos.',
            author: {
              id: 'student-3',
              name: 'Ana López',
              avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=8b5cf6&color=fff',
              role: 'student',
            },
            createdAt: new Date('2024-03-15T12:00:00'),
            likes: 1,
            replies: [],
          },
        ],
      },

      // Comentarios del post-2 (Organizar tiempo)
      {
        id: 'comment-3',
        postId: 'post-2',
        content:
          'Te recomiendo dedicar 1-2 horas diarias en las mañanas antes del trabajo. A mí me funciona muy bien.',
        author: {
          id: 'student-2',
          name: 'Juan Pérez',
          avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=f59e0b&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        likes: 4,
        replies: [
          {
            id: 'comment-3-1',
            postId: 'post-2',
            parentCommentId: 'comment-3',
            content: 'Excelente consejo! Yo también estudio en las mañanas.',
            author: {
              id: 'student-4',
              name: 'Pedro Martínez',
              avatar: 'https://ui-avatars.com/api/?name=Pedro+Martinez&background=ef4444&color=fff',
              role: 'student',
            },
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            likes: 2,
            replies: [],
          },
        ],
      },
      {
        id: 'comment-4',
        postId: 'post-2',
        content:
          'Lo importante es ser consistente. Mejor 30 minutos diarios que 5 horas un solo día.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
        likes: 8,
        replies: [],
      },

      // Comentarios del post-4 (div vs section)
      {
        id: 'comment-5',
        postId: 'post-4',
        content:
          '<div> es genérico, <section> es semántico y representa una sección temática. Usa section cuando el contenido tenga un significado específico.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        likes: 6,
        replies: [
          {
            id: 'comment-5-1',
            postId: 'post-4',
            parentCommentId: 'comment-5',
            content: 'Perfecto! Ahora entiendo. Gracias profesor!',
            author: {
              id: 'student-3',
              name: 'Ana López',
              avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=8b5cf6&color=fff',
              role: 'student',
            },
            createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
            likes: 1,
            replies: [],
          },
        ],
      },

      // Comentarios del post-6 (Flexbox)
      {
        id: 'comment-6',
        postId: 'post-6',
        content:
          'Revisa si tienes display: flex en el contenedor padre. Es un error común olvidarlo.',
        author: {
          id: 'student-2',
          name: 'Juan Pérez',
          avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=f59e0b&color=fff',
          role: 'student',
        },
        createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        likes: 2,
        replies: [
          {
            id: 'comment-6-1',
            postId: 'post-6',
            parentCommentId: 'comment-6',
            content: 'Era eso! Olvidé el display: flex. Muchas gracias!',
            author: {
              id: 'student-4',
              name: 'Pedro Martínez',
              avatar: 'https://ui-avatars.com/api/?name=Pedro+Martinez&background=ef4444&color=fff',
              role: 'student',
            },
            createdAt: new Date(Date.now() - 2.3 * 24 * 60 * 60 * 1000),
            likes: 1,
            replies: [],
          },
        ],
      },

      // Comentarios del post-7 (Promesas)
      {
        id: 'comment-7',
        postId: 'post-7',
        content:
          'Una promesa es como un "vale" que te dan cuando pides algo que tarda en llegar. Puede resolverse (éxito) o rechazarse (error).',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        createdAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000),
        likes: 7,
        replies: [
          {
            id: 'comment-7-1',
            postId: 'post-7',
            parentCommentId: 'comment-7',
            content: 'Excelente analogía! Ahora tiene más sentido.',
            author: {
              id: 'student-5',
              name: 'Laura Sánchez',
              avatar: 'https://ui-avatars.com/api/?name=Laura+Sanchez&background=ec4899&color=fff',
              role: 'student',
            },
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            likes: 2,
            replies: [],
          },
        ],
      },
    ],

    // Anuncios del curso
    announcements: [
      {
        id: 'ann-1',
        title: 'Cambio de fecha del examen final',
        content:
          'Estimados estudiantes, debido a un evento institucional programado, el examen final se ha reprogramado para el 15 de diciembre a las 10:00 AM. Por favor, revisen el nuevo calendario adjunto y ajusten sus horarios en consecuencia. Cualquier duda, no duden en contactarme.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
        likes: 24,
        isLiked: false,
        attachments: [
          {
            id: 'att-1',
            name: 'nuevo_calendario_examenes.pdf',
            type: 'pdf',
            url: 'https://example.com/calendario.pdf',
            size: '250 KB',
          },
        ],
        isPinned: true,
      },
      {
        id: 'ann-2',
        title: 'Entrega del proyecto final - Fecha límite',
        content:
          'Recuerden que la fecha límite para la entrega del proyecto final es el 10 de diciembre a las 23:59. El proyecto debe incluir todos los requisitos especificados en la rúbrica de evaluación. No se aceptarán entregas tardías sin justificación previa.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'high',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hace 1 día
        likes: 18,
        isLiked: true,
        attachments: [
          {
            id: 'att-2',
            name: 'rubrica_evaluacion_proyecto.pdf',
            type: 'pdf',
            url: 'https://example.com/rubrica.pdf',
            size: '180 KB',
          },
        ],
        isPinned: false,
      },
      {
        id: 'ann-3',
        title: 'Tarea 3 disponible en la plataforma',
        content:
          'Ya está disponible la Tarea 3 sobre JavaScript avanzado. Tienen hasta el viernes para completarla. La tarea cubre temas de async/await, promesas y manejo de errores. Recuerden revisar los ejemplos de clase.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'medium',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 días
        likes: 12,
        isLiked: false,
        isPinned: false,
      },
      {
        id: 'ann-4',
        title: 'Clase de repaso este viernes',
        content:
          'Tendremos una clase de repaso este viernes 8 de diciembre a las 4:00 PM en el aula 301. Repasaremos los temas más importantes del módulo 3 y resolveremos dudas para el examen final. La asistencia es opcional pero altamente recomendada.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'medium',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // hace 3 días
        likes: 15,
        isLiked: false,
        isPinned: false,
      },
      {
        id: 'ann-5',
        title: 'Recursos adicionales de CSS Grid',
        content:
          'Les comparto algunos recursos adicionales sobre CSS Grid que pueden ser muy útiles para sus proyectos. Incluye una guía completa en PDF y ejemplos prácticos en un archivo ZIP. Espero que les sean de ayuda.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'low',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // hace 5 días
        likes: 8,
        isLiked: false,
        attachments: [
          {
            id: 'att-3',
            name: 'guia_css_grid.pdf',
            type: 'pdf',
            url: 'https://example.com/css-grid.pdf',
            size: '1.2 MB',
          },
          {
            id: 'att-4',
            name: 'ejemplos_css_grid.zip',
            type: 'document',
            url: 'https://example.com/ejemplos.zip',
            size: '3.5 MB',
          },
        ],
        isPinned: false,
      },
      {
        id: 'ann-6',
        title: 'Encuesta de satisfacción del curso',
        content:
          'Por favor, tómense unos minutos para completar la encuesta de satisfacción del curso. Sus comentarios son muy valiosos para mejorar la calidad de la enseñanza. La encuesta es anónima y toma aproximadamente 5 minutos.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'low',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 1 semana
        likes: 6,
        isLiked: false,
        attachments: [
          {
            id: 'att-5',
            name: 'Encuesta de satisfacción',
            type: 'link',
            url: 'https://forms.google.com/encuesta-curso',
          },
        ],
        isPinned: false,
      },
      {
        id: 'ann-7',
        title: 'Horario de asesorías actualizado',
        content:
          'Se ha actualizado el horario de asesorías para las próximas semanas. Las asesorías serán los martes y jueves de 2:00 PM a 4:00 PM en mi oficina (Edificio B, piso 3, oficina 305). Pueden agendar cita por correo o en persona.',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'medium',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // hace 1 semana
        likes: 10,
        isLiked: false,
        isPinned: false,
      },
      {
        id: 'ann-8',
        title: 'Bienvenidos al curso de Desarrollo Web',
        content:
          'Bienvenidos al curso de Desarrollo Web Full Stack. Estoy muy emocionado de tenerlos en esta aventura de aprendizaje. Durante el semestre aprenderemos HTML, CSS, JavaScript y frameworks modernos. Espero que disfruten el curso y aprendan mucho. ¡Éxitos a todos!',
        author: {
          id: 'instructor-1',
          name: 'Carlos Mendoza',
          avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
          role: 'instructor',
        },
        priority: 'low',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // hace 2 meses
        likes: 32,
        isLiked: true,
        isPinned: false,
      },
    ],

    // Calificaciones del curso
    grades: {
      id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
      nombre: 'Desarrollo Web Full Stack',
      codigo: 'DW-2024-01',
      profesor: 'Prof. Carlos Mendoza',
      creditos: 4,
      avance: 75,
      promedio: 17.5,
      estado: 'En Curso',
      evaluaciones: [
        {
          actividad: 'Examen Parcial - HTML & CSS',
          peso: 20,
          nota: 18,
          estado: 'Completado',
        },
        {
          actividad: 'Proyecto: Landing Page Responsiva',
          peso: 25,
          nota: 19,
          estado: 'Completado',
        },
        {
          actividad: 'Laboratorio: JavaScript ES6+',
          peso: 15,
          nota: 16,
          estado: 'Completado',
        },
        {
          actividad: 'Proyecto Final: Aplicación CRUD',
          peso: 40,
          nota: 0,
          estado: 'Pendiente',
        },
      ],
      promedioClase: 15.8,
      posicionamiento: 3,
      totalEstudiantes: 45,
      isExpanded: false,
    },
  };

  upcomingAssignments: Assignment[] = [
    {
      id: '1',
      titulo: 'Proyecto: Landing Page',
      cursoNombre: 'Desarrollo Web Full Stack',
      fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      esUrgente: false,
      mes: 'OCT',
      dia: 15,
    },
    {
      id: '2',
      titulo: 'Quiz: Modelo de Caja',
      cursoNombre: 'Desarrollo Web Full Stack',
      fechaLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      esUrgente: false,
      mes: 'OCT',
      dia: 22,
    },
  ];

  // Signals para tab Materiales
  activeFilter = signal<MaterialType | 'all'>('all');
  searchQuery = signal('');

  // Tipos de materiales para filtros
  materialTypes: MaterialType[] = ['video', 'pdf', 'code', 'link', 'document'];

  // Computed: materiales filtrados
  filteredMaterials = computed(() => {
    let materials = this.course.materials;

    // Filtrar por tipo
    if (this.activeFilter() !== 'all') {
      materials = materials.filter((m) => m.type === this.activeFilter());
    }

    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      materials = materials.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.moduleName.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query),
      );
    }

    return materials;
  });

  // Computed: materiales agrupados por módulo
  groupedMaterials = computed(() => {
    const materials = this.filteredMaterials();
    const grouped: { [key: string]: { moduleName: string; materials: CourseMaterial[] } } = {};

    materials.forEach((material) => {
      if (!grouped[material.moduleId]) {
        grouped[material.moduleId] = {
          moduleName: material.moduleName,
          materials: [],
        };
      }
      grouped[material.moduleId].materials.push(material);
    });

    return Object.values(grouped);
  });

  // Signals para tab Foros
  selectedForum = signal<Forum | null>(null);
  selectedPost = signal<ForumPost | null>(null);

  // Computed: posts del foro seleccionado
  postsInSelectedForum = computed(() => {
    const forum = this.selectedForum();
    if (!forum) return [];
    return this.course.forumPosts.filter((p) => p.forumId === forum.id);
  });

  // Computed: comentarios del post seleccionado
  commentsInSelectedPost = computed(() => {
    const post = this.selectedPost();
    if (!post) return [];
    return this.course.forumComments.filter((c) => c.postId === post.id && !c.parentCommentId);
  });

  // ========== ANUNCIOS ==========
  // Signal para búsqueda de anuncios
  announcementSearchQuery = signal('');

  // Signal para filtro de prioridad
  announcementPriorityFilter = signal<'all' | 'high' | 'medium' | 'low'>('all');

  // Computed: anuncios filtrados y ordenados
  filteredAnnouncements = computed(() => {
    let announcements = this.course.announcements;

    // Filtrar por prioridad
    if (this.announcementPriorityFilter() !== 'all') {
      announcements = announcements.filter((a) => a.priority === this.announcementPriorityFilter());
    }

    // Filtrar por búsqueda
    const query = this.announcementSearchQuery().toLowerCase();
    if (query) {
      announcements = announcements.filter(
        (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query),
      );
    }

    // Ordenar: pinned primero, luego por fecha descendente
    return announcements.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  });

  // Computed: próxima lección no completada
  nextLesson = computed(() => {
    for (const module of this.course.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.isCompleted && !lesson.isLocked) {
          return lesson;
        }
      }
    }
    return null;
  });

  constructor(private route: ActivatedRoute) {}

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
      video: 'play-circle',
      reading: 'document-text',
      quiz: 'clipboard-document-check',
      assignment: 'pencil-square',
    };
    return icons[type] || 'document';
  }

  startLesson(lesson: Lesson): void {
    if (lesson.isLocked) {
      return;
    }

    // Simular inicio de lección
    const lessonType =
      lesson.type === 'video'
        ? 'video'
        : lesson.type === 'reading'
          ? 'lectura'
          : lesson.type === 'quiz'
            ? 'quiz'
            : 'tarea';

    const message = lesson.isCompleted
      ? `Revisando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`
      : `Iniciando ${lessonType}: "${lesson.title}"\n\nDuración: ${lesson.duration}\n\nEn una implementación completa, esto abriría el contenido de la lección en un modal o nueva página.`;

    alert(message);

    // Marcar como completada si no lo estaba
    if (!lesson.isCompleted) {
      lesson.isCompleted = true;
    }
  }

  continueCurrentLesson(): void {
    const next = this.nextLesson();
    if (next) {
      this.startLesson(next);
    } else {
      alert('¡Felicidades! Has completado todas las lecciones disponibles.');
    }
  }

  // Métodos para tab Materiales
  filterByType(type: MaterialType | 'all'): void {
    this.activeFilter.set(type);
  }

  searchMaterials(query: string): void {
    this.searchQuery.set(query);
  }

  countByType(type: MaterialType): number {
    return this.course.materials.filter((m) => m.type === type).length;
  }

  downloadMaterial(material: CourseMaterial): void {
    console.log('Downloading:', material.title);
    // Simular descarga
    window.open(material.url, '_blank');
  }

  previewMaterial(material: CourseMaterial): void {
    console.log('Previewing:', material.title);
    // Abrir en modal o nueva ventana
    window.open(material.url, '_blank');
  }

  getMaterialIcon(type: MaterialType): string {
    const icons: Record<MaterialType, string> = {
      video:
        'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      pdf: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      document:
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return icons[type];
  }

  getMaterialColor(type: MaterialType): string {
    const colors: Record<MaterialType, string> = {
      video: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      pdf: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      code: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      link: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      document: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    };
    return colors[type];
  }

  getMaterialTypeLabel(type: MaterialType): string {
    const labels: Record<MaterialType, string> = {
      video: 'Video',
      pdf: 'PDF',
      code: 'Código',
      link: 'Enlace',
      document: 'Documento',
    };
    return labels[type];
  }

  // Métodos para tab Foros
  selectForum(forum: Forum): void {
    this.selectedForum.set(forum);
    this.selectedPost.set(null);
  }

  selectPost(post: ForumPost): void {
    this.selectedPost.set(post);
  }

  backToForums(): void {
    this.selectedForum.set(null);
    this.selectedPost.set(null);
  }

  backToPosts(): void {
    this.selectedPost.set(null);
  }

  likePost(post: ForumPost): void {
    post.likes++;
  }

  likeComment(comment: ForumComment): void {
    comment.likes++;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    if (days < 7) return `hace ${days}d`;
    if (weeks < 4) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  searchAnnouncements(query: string): void {
    this.announcementSearchQuery.set(query);
  }
  // Filtrar por prioridad
  filterAnnouncementsByPriority(priority: 'all' | 'high' | 'medium' | 'low'): void {
    this.announcementPriorityFilter.set(priority);
  }
  // Like announcement (toggle)
  likeAnnouncement(announcement: Announcement): void {
    if (announcement.isLiked) {
      announcement.likes--;
      announcement.isLiked = false;
    } else {
      announcement.likes++;
      announcement.isLiked = true;
    }
  }
  // Obtener clase CSS del badge de prioridad
  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };
    return classes[priority] || '';
  }
  // Obtener label de prioridad
  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      high: 'Alta Prioridad',
      medium: 'Media Prioridad',
      low: 'Baja Prioridad',
    };
    return labels[priority] || '';
  }
  // Obtener icono de adjunto (path SVG)
  getAttachmentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      image:
        'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      document:
        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    };
    return icons[type] || icons['document'];
  }
  // Descargar adjunto
  downloadAttachment(attachment: AnnouncementAttachment): void {
    window.open(attachment.url, '_blank');
  }
  getPromedioColor(promedio: number): string {
    if (promedio >= 17) return 'text-green-600 dark:text-green-400 font-bold';
    if (promedio >= 14) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (promedio >= 11) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  }
  // Obtener badge de estado
  getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      Completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Pendiente: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[estado] || 'bg-gray-100 text-gray-700';
  }
  // Mostrar nota o "--" si está pendiente
  getNotaDisplay(nota: number, estado: string): string {
    return estado === 'Pendiente' ? '--' : nota.toFixed(1);
  }
}
