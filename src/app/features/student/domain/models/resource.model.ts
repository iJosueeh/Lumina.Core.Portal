export interface Resource {
    id: string;
    title: string;
    description: string;
    category: string;
    type: 'pdf' | 'video' | 'code' | 'link' | 'book';
    url: string;
    imageUrl?: string;
    badge?: string;
    isFeatured: boolean;
    uploadDate: Date;
    fileSize?: string;
}

export interface ResourceCategory {
    id: string;
    name: string;
    icon: string;
    description: string;
    count: number;
}
