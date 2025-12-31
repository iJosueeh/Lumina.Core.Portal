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

export interface CourseDetail {
    id: string;
    title: string;
    instructor: {
        name: string;
        title: string;
        avatar: string;
    };
    semester: string;
    progress: number;
    completedModules: number;
    totalModules: number;
    coverImage: string;
    modules: Module[];
}
