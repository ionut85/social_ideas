export interface Tag {
  id: number;
  name: string;
}

export interface Idea {
  id: number;
  title: string;
  description?: string;
  platform: string;
  createdAt: string;
  order: number;
  tags: Tag[];
}