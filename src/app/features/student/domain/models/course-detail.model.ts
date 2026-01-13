import { CourseGrade, Evaluation } from './grade.model';

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  duration: string;
  isExpanded: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment';
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  availableIn?: string;
}

export interface Instructor {
  name: string;
  title: string;
  avatar: string;
  bio: string;
  experience: string;
  education: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}

export type MaterialType = 'video' | 'pdf' | 'code' | 'link' | 'document';

export interface CourseMaterial {
  id: string;
  title: string;
  type: MaterialType;
  moduleId: string;
  moduleName: string;
  lessonId?: string;
  lessonName?: string;
  description?: string;
  url: string;
  fileSize?: string;
  duration?: string; // Para videos
  isViewed: boolean;
  uploadDate: Date;
  downloadCount?: number;
}

export interface Forum {
  id: string;
  title: string;
  description: string;
  type: 'general' | 'module' | 'weekly';
  moduleId?: string;
  moduleName?: string;
  weekNumber?: number;
  isActive: boolean;
  postCount: number;
  lastActivity: Date;
  createdBy: string;
  createdAt: Date;
}

export interface ForumPost {
  id: string;
  forumId: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'student' | 'instructor';
  };
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  commentCount: number;
  isPinned: boolean;
  isResolved: boolean;
  tags?: string[];
}

export interface ForumComment {
  id: string;
  postId: string;
  parentCommentId?: string; // Para comentarios anidados
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'student' | 'instructor';
  };
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  replies: ForumComment[]; // Comentarios anidados
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document' | 'link';
  url: string;
  size?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'instructor';
  };
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  isLiked: boolean;
  attachments?: AnnouncementAttachment[];
  isPinned: boolean;
}

export interface CourseDetail {
  id: string;
  title: string;
  instructor: Instructor;
  semester: string;
  progress: number;
  completedModules: number;
  totalModules: number;
  coverImage: string;
  modules: Module[];
  materials: CourseMaterial[]; // NUEVO
  forums: Forum[]; // NUEVO
  forumPosts: ForumPost[]; // NUEVO
  forumComments: ForumComment[]; // NUEVO
  announcements: Announcement[]; // NUEVO
  grades?: CourseGrade; // NUEVO - Calificaciones del curso

  // Descripción
  description: string;
  learningObjectives: string[];
  whatYouWillLearn: string[];
  requirements: string[];
  level: 'Principiante' | 'Intermedio' | 'Avanzado';

  // Información del curso
  modality: 'Presencial' | 'Virtual' | 'Híbrido';
  schedule: string;
  credits: number;
  startDate: Date;
  endDate: Date;
  totalDuration: string;
  totalLessons: number;
  resources: string[];
}

// Re-export para facilitar imports
export type { CourseGrade, Evaluation };
