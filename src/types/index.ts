export interface User {
  id: string;
  name: string;
  color: string;
  role: 'user' | 'admin';
}

export interface ShoppingList {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  tags: string[];
  items: Record<string, ShoppingItem>;
  assignedToIds: string[];
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  addedBy: string;
  checkedBy?: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assignedToIds: string[];
  createdBy: string;
  createdAt: string;
  deadline?: string;
  tags: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  lastEditedBy: string;
  lastEditedAt: string;
  tags: string[];
  pinned: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TrashItem {
  id: string;
  entityType: 'shoppingList' | 'task' | 'note';
  data: ShoppingList | Task | Note;
  deletedBy: string;
  deletedAt: string;
}

export interface ChangelogEntry {
  id: string;
  entityType: 'shoppingList' | 'task' | 'note' | 'tag';
  entityId: string;
  entityTitle: string;
  action: 'create' | 'update' | 'delete' | 'check' | 'uncheck';
  performedBy: string;
  performedAt: string;
  summary: string;
  relevantUserIds?: string[];
}

export interface AppData {
  shoppingLists: Record<string, ShoppingList>;
  tasks: Record<string, Task>;
  notes: Record<string, Note>;
  tags: Record<string, Tag>;
  users: Record<string, User>;
  changelog: ChangelogEntry[];
  trash: TrashItem[];
}

export type DataFile = 'shopping-lists' | 'tasks' | 'notes' | 'tags' | 'users' | 'changelog';
