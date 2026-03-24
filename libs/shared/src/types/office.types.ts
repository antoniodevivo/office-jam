export interface Office {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfficeInput {
  name: string;
  description?: string;
}
