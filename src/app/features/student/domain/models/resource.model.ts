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

// Autor de recurso
export interface ResourceAuthor {
  name: string;
  title: string;
  avatar: string;
  email?: string;
}

// Detalle extendido de recurso
export interface ResourceDetail extends Resource {
  author?: ResourceAuthor;
  publishDate: Date;
  lastUpdated?: Date;
  downloads: number;
  views: number;
  rating?: number;
  tags: string[];
  relatedResources?: Resource[];
  content?: string;
  format?: string;
  language?: string;
  version?: string;
  requirements?: string[];
  isFavorite?: boolean;
}

// Filtros para recursos
export interface ResourceFilter {
  category?: string;
  type?: 'pdf' | 'video' | 'code' | 'link' | 'book' | 'all';
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'alphabetical';
  viewMode?: 'grid' | 'list';
}
