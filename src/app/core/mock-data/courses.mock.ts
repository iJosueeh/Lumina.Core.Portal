import type {
  CourseDetail,
  Module,
  Lesson,
} from '../../features/student/domain/models/course-detail.model';

/**
 * Mock Data - Detalles de Cursos
 * Datos estáticos para mostrar contenido de cursos sin backend
 */

export const MOCK_COURSE_DETAILS: CourseDetail[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    title: 'Desarrollo Web Full Stack',
    instructor: {
      name: 'Prof. Carlos Mendoza',
      title: 'Ingeniero de Software Senior',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=3b82f6&color=fff',
      bio: 'Ingeniero de Software con más de 10 años de experiencia en desarrollo web. Apasionado por enseñar y compartir conocimientos.',
      experience:
        'Senior Software Engineer en TechCorp (5 años), Full Stack Developer en StartupXYZ (3 años)',
      education: 'Maestría en Ciencias de la Computación - Universidad Nacional',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/carlosmendoza',
        github: 'https://github.com/carlosmendoza',
        twitter: 'https://twitter.com/carlosdev',
        website: 'https://carlosmendoza.dev',
      },
    },
    semester: '2024-1',
    progress: 75,
    completedModules: 3,
    totalModules: 4,
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',

    // Descripción
    description:
      'Aprende a desarrollar aplicaciones web modernas desde cero. Este curso te llevará desde los fundamentos de HTML, CSS y JavaScript hasta frameworks avanzados como React y Node.js.',
    learningObjectives: [
      'Dominar los fundamentos de HTML5, CSS3 y JavaScript moderno',
      'Crear interfaces de usuario responsivas y atractivas',
      'Desarrollar aplicaciones web con React',
      'Construir APIs RESTful con Node.js y Express',
      'Implementar bases de datos con MongoDB',
    ],
    whatYouWillLearn: [
      'HTML5 semántico y accesibilidad web',
      'CSS3 avanzado: Flexbox, Grid, Animaciones',
      'JavaScript ES6+: Async/Await, Promises, Modules',
      'React: Hooks, Context API, React Router',
      'Node.js y Express para backend',
      'Bases de datos NoSQL con MongoDB',
      'Testing con Jest',
      'Git y GitHub para control de versiones',
    ],
    requirements: [
      'Conocimientos básicos de programación',
      'Computadora con Windows, Mac o Linux',
      'Editor de código (VS Code recomendado)',
      'Conexión a internet estable',
    ],
    level: 'Intermedio',

    // Información del curso
    modality: 'Híbrido',
    schedule: 'Lunes y Miércoles 18:00 - 21:00',
    credits: 4,
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-07-30'),
    totalDuration: '120 horas',
    totalLessons: 45,
    resources: [
      'Videos HD descargables',
      'Código fuente de todos los proyectos',
      'Slides de presentación',
      'Ejercicios prácticos',
      'Certificado de finalización',
    ],

    modules: [
      {
        id: 'mod-1',
        title: 'Módulo 1: Fundamentos de HTML y CSS',
        duration: '4 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-1-1',
            title: 'Introducción a HTML5',
            type: 'video',
            duration: '45 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-1-2',
            title: 'Estructura semántica de HTML',
            type: 'reading',
            duration: '30 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-1-3',
            title: 'CSS: Selectores y Propiedades',
            type: 'video',
            duration: '60 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-1-4',
            title: 'Flexbox y Grid Layout',
            type: 'video',
            duration: '75 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-1-5',
            title: 'Quiz: Fundamentos HTML/CSS',
            type: 'quiz',
            duration: '20 min',
            isCompleted: true,
            isLocked: false,
          },
        ],
      },
      {
        id: 'mod-2',
        title: 'Módulo 2: JavaScript Moderno',
        duration: '5 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-2-1',
            title: 'Variables y Tipos de Datos',
            type: 'video',
            duration: '50 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-2-2',
            title: 'Funciones y Arrow Functions',
            type: 'video',
            duration: '55 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-2-3',
            title: 'DOM Manipulation',
            type: 'video',
            duration: '70 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-2-4',
            title: 'Asincronía: Promises y Async/Await',
            type: 'video',
            duration: '80 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-2-5',
            title: 'Proyecto: Aplicación Interactiva',
            type: 'assignment',
            duration: '3 horas',
            isCompleted: true,
            isLocked: false,
          },
        ],
      },
      {
        id: 'mod-3',
        title: 'Módulo 3: Frameworks Frontend',
        duration: '6 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-3-1',
            title: 'Introducción a React',
            type: 'video',
            duration: '60 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-3-2',
            title: 'Componentes y Props',
            type: 'video',
            duration: '65 min',
            isCompleted: false,
            isLocked: false,
          },
          {
            id: 'lesson-3-3',
            title: 'State y Hooks',
            type: 'video',
            duration: '70 min',
            isCompleted: false,
            isLocked: false,
          },
          {
            id: 'lesson-3-4',
            title: 'Proyecto Final: SPA con React',
            type: 'assignment',
            duration: '5 horas',
            isCompleted: false,
            isLocked: true,
          },
        ],
      },
      {
        id: 'mod-4',
        title: 'Módulo 4: Backend con Node.js',
        duration: '5 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-4-1',
            title: 'Introducción a Node.js',
            type: 'video',
            duration: '50 min',
            isCompleted: false,
            isLocked: true,
          },
          {
            id: 'lesson-4-2',
            title: 'Express.js y APIs REST',
            type: 'video',
            duration: '80 min',
            isCompleted: false,
            isLocked: true,
          },
        ],
      },
    ],

    // Materiales del curso
    materials: [
      {
        id: 'mat-web-1',
        title: 'Video: Introducción a HTML5',
        type: 'video',
        moduleId: 'mod-1',
        moduleName: 'Módulo 1: Fundamentos de HTML y CSS',
        lessonId: 'lesson-1-1',
        lessonName: 'Introducción a HTML5',
        description: 'Grabación completa de la clase introductoria',
        url: 'https://example.com/videos/html5-intro.mp4',
        fileSize: '120 MB',
        duration: '45 min',
        isViewed: true,
        uploadDate: new Date('2024-03-16'),
        downloadCount: 45,
      },
      {
        id: 'mat-web-2',
        title: 'Slides: HTML Semántico',
        type: 'pdf',
        moduleId: 'mod-1',
        moduleName: 'Módulo 1: Fundamentos de HTML y CSS',
        description: 'Presentación sobre etiquetas semánticas',
        url: 'https://example.com/slides/html-semantico.pdf',
        fileSize: '2.5 MB',
        isViewed: true,
        uploadDate: new Date('2024-03-17'),
        downloadCount: 52,
      },
      {
        id: 'mat-web-3',
        title: 'Código: Ejemplos HTML',
        type: 'code',
        moduleId: 'mod-1',
        moduleName: 'Módulo 1: Fundamentos de HTML y CSS',
        description: 'Archivos de ejemplo con código HTML',
        url: 'https://example.com/code/html-examples.zip',
        fileSize: '1.2 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-18'),
        downloadCount: 38,
      },
    ],

    // Foros
    forums: [],
    forumPosts: [],
    forumComments: [],
    announcements: [],
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    title: 'Inteligencia Artificial y Machine Learning',
    instructor: {
      name: 'Dra. Ana García',
      title: 'Investigadora en IA',
      avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia&background=10b981&color=fff',
      bio: 'Doctora en Inteligencia Artificial con 8 años de experiencia en investigación y desarrollo de modelos de ML.',
      experience: 'Research Scientist en AI Lab (4 años), ML Engineer en DataCorp (3 años)',
      education:
        'Doctorado en Inteligencia Artificial - MIT, Maestría en Ciencias de la Computación',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/anagarcia',
        github: 'https://github.com/anagarcia',
        website: 'https://anagarcia.ai',
      },
    },
    semester: '2024-1',
    progress: 40,
    completedModules: 2,
    totalModules: 5,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',

    // Descripción
    description:
      'Sumérgete en el fascinante mundo de la Inteligencia Artificial y Machine Learning. Aprende a construir modelos predictivos, redes neuronales y sistemas inteligentes.',
    learningObjectives: [
      'Comprender los fundamentos de Machine Learning',
      'Implementar algoritmos de clasificación y regresión',
      'Construir redes neuronales con TensorFlow',
      'Aplicar técnicas de Deep Learning',
      'Desarrollar proyectos de IA del mundo real',
    ],
    whatYouWillLearn: [
      'Fundamentos de Machine Learning',
      'Algoritmos supervisados y no supervisados',
      'Redes neuronales y Deep Learning',
      'TensorFlow y Keras',
      'Procesamiento de lenguaje natural (NLP)',
      'Computer Vision',
      'Optimización de modelos',
      'Despliegue de modelos en producción',
    ],
    requirements: [
      'Conocimientos de Python',
      'Matemáticas básicas (álgebra lineal, cálculo)',
      'Estadística básica',
      'GPU recomendada para entrenamientos',
    ],
    level: 'Avanzado',

    // Información del curso
    modality: 'Virtual',
    schedule: 'Martes y Jueves 19:00 - 22:00',
    credits: 5,
    startDate: new Date('2024-03-20'),
    endDate: new Date('2024-08-15'),
    totalDuration: '150 horas',
    totalLessons: 60,
    resources: [
      'Notebooks de Jupyter',
      'Datasets para práctica',
      'Papers de investigación',
      'Modelos pre-entrenados',
      'Certificado profesional',
    ],

    modules: [
      {
        id: 'mod-ai-1',
        title: 'Módulo 1: Fundamentos de ML',
        duration: '3 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-ai-1-1',
            title: 'Introducción a Machine Learning',
            type: 'video',
            duration: '60 min',
            isCompleted: true,
            isLocked: false,
          },
          {
            id: 'lesson-ai-1-2',
            title: 'Regresión Lineal',
            type: 'video',
            duration: '75 min',
            isCompleted: true,
            isLocked: false,
          },
        ],
      },
      {
        id: 'mod-ai-2',
        title: 'Módulo 2: Deep Learning',
        duration: '4 semanas',
        isExpanded: false,
        lessons: [
          {
            id: 'lesson-ai-2-1',
            title: 'Redes Neuronales',
            type: 'video',
            duration: '90 min',
            isCompleted: false,
            isLocked: false,
          },
        ],
      },
    ],

    // Materiales del curso
    materials: [
      {
        id: 'mat-ai-1',
        title: 'Video: Introducción a ML',
        type: 'video',
        moduleId: 'mod-ai-1',
        moduleName: 'Módulo 1: Fundamentos de ML',
        lessonId: 'lesson-ai-1-1',
        lessonName: 'Introducción a Machine Learning',
        description: 'Clase introductoria sobre Machine Learning',
        url: 'https://example.com/videos/ml-intro.mp4',
        fileSize: '150 MB',
        duration: '60 min',
        isViewed: true,
        uploadDate: new Date('2024-03-20'),
        downloadCount: 32,
      },
      {
        id: 'mat-ai-2',
        title: 'Notebook: Regresión Lineal',
        type: 'code',
        moduleId: 'mod-ai-1',
        moduleName: 'Módulo 1: Fundamentos de ML',
        description: 'Jupyter Notebook con ejemplos de regresión',
        url: 'https://example.com/notebooks/linear-regression.ipynb',
        fileSize: '2.8 MB',
        isViewed: true,
        uploadDate: new Date('2024-03-21'),
        downloadCount: 28,
      },
      {
        id: 'mat-ai-3',
        title: 'Paper: Deep Learning Basics',
        type: 'pdf',
        moduleId: 'mod-ai-2',
        moduleName: 'Módulo 2: Deep Learning',
        description: 'Paper de investigación sobre fundamentos de DL',
        url: 'https://example.com/papers/dl-basics.pdf',
        fileSize: '5.2 MB',
        isViewed: false,
        uploadDate: new Date('2024-03-25'),
        downloadCount: 15,
      },
    ],

    // Foros
    forums: [],
    forumPosts: [],
    forumComments: [],
    announcements: [],
  },
];

/**
 * Helper: Obtener curso por ID
 */
export function getCourseById(courseId: string): CourseDetail | undefined {
  return MOCK_COURSE_DETAILS.find((course) => course.id === courseId);
}

/**
 * Helper: Obtener todos los cursos
 */
export function getAllCourses(): CourseDetail[] {
  return MOCK_COURSE_DETAILS;
}
