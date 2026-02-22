import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  AppData,
  ShoppingList,
  Task,
  Note,
  Tag,
  User,
  ChangelogEntry,
} from '../types';
import { useAuth } from './AuthContext';
import { readJsonFile, writeJsonFile } from '../services/github';

type DataCollection = keyof Omit<AppData, 'changelog'>;

interface Shas {
  'shopping-lists': string | null;
  tasks: string | null;
  notes: string | null;
  tags: string | null;
  users: string | null;
  changelog: string | null;
}

interface DataState {
  data: AppData;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Shopping lists
  saveShoppingList: (list: ShoppingList, userName: string) => Promise<void>;
  deleteShoppingList: (id: string, userName: string) => Promise<void>;

  // Tasks
  saveTask: (task: Task, userName: string) => Promise<void>;
  deleteTask: (id: string, userName: string) => Promise<void>;

  // Notes
  saveNote: (note: Note, userName: string) => Promise<void>;
  deleteNote: (id: string, userName: string) => Promise<void>;

  // Tags
  saveTag: (tag: Tag) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Users
  saveUser: (user: User) => Promise<void>;
}

const emptyData: AppData = {
  shoppingLists: {},
  tasks: {},
  notes: {},
  tags: {},
  users: {},
  changelog: [],
};

const DataContext = createContext<DataState | null>(null);

const REFRESH_INTERVAL = 30_000;

export function DataProvider({ children }: { children: ReactNode }) {
  const { config } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shas = useRef<Shas>({
    'shopping-lists': null,
    tasks: null,
    notes: null,
    tags: null,
    users: null,
    changelog: null,
  });

  const loadAll = useCallback(async () => {
    if (!config) return;
    try {
      const [sl, t, n, tg, u, cl] = await Promise.all([
        readJsonFile<Record<string, ShoppingList>>(config, 'shopping-lists', {}),
        readJsonFile<Record<string, Task>>(config, 'tasks', {}),
        readJsonFile<Record<string, Note>>(config, 'notes', {}),
        readJsonFile<Record<string, Tag>>(config, 'tags', {}),
        readJsonFile<Record<string, User>>(config, 'users', {}),
        readJsonFile<ChangelogEntry[]>(config, 'changelog', []),
      ]);

      shas.current = {
        'shopping-lists': sl.sha,
        tasks: t.sha,
        notes: n.sha,
        tags: tg.sha,
        users: u.sha,
        changelog: cl.sha,
      };

      setData({
        shoppingLists: sl.data,
        tasks: t.data,
        notes: n.data,
        tags: tg.data,
        users: u.data,
        changelog: cl.data,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba načítání dat');
    }
  }, [config]);

  const refresh = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!config) return;
    setIsLoading(true);
    loadAll().finally(() => setIsLoading(false));

    const interval = setInterval(loadAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [config, loadAll]);

  const addChangelog = useCallback(
    async (entry: Omit<ChangelogEntry, 'id' | 'performedAt'>) => {
      if (!config) return;
      const full: ChangelogEntry = {
        ...entry,
        id: generateId(),
        performedAt: new Date().toISOString(),
      };
      const updated = [...data.changelog, full].slice(-200); // Keep last 200
      const newSha = await writeJsonFile(
        config,
        'changelog',
        updated,
        `[Colabala] ${entry.performedBy}: ${entry.summary}`,
        shas.current.changelog ?? undefined,
      );
      shas.current.changelog = newSha;
      setData((prev) => ({ ...prev, changelog: updated }));
    },
    [config, data.changelog],
  );

  // Generic save for record-based collections
  const saveToCollection = useCallback(
    async <T extends { id: string }>(
      collection: DataCollection,
      file: keyof Shas,
      item: T,
    ) => {
      if (!config) return;
      setIsSaving(true);
      try {
        const updated = {
          ...(data[collection] as unknown as Record<string, T>),
          [item.id]: item,
        };
        const newSha = await writeJsonFile(
          config,
          file,
          updated,
          `[Colabala] Aktualizace ${file}`,
          shas.current[file] ?? undefined,
        );
        shas.current[file] = newSha;
        setData((prev) => ({ ...prev, [collection]: updated }));
      } finally {
        setIsSaving(false);
      }
    },
    [config, data],
  );

  const deleteFromCollection = useCallback(
    async <T extends { id: string }>(
      collection: DataCollection,
      file: keyof Shas,
      id: string,
    ) => {
      if (!config) return;
      setIsSaving(true);
      try {
        const current = { ...(data[collection] as unknown as Record<string, T>) };
        delete current[id];
        const newSha = await writeJsonFile(
          config,
          file,
          current,
          `[Colabala] Smazání z ${file}`,
          shas.current[file] ?? undefined,
        );
        shas.current[file] = newSha;
        setData((prev) => ({ ...prev, [collection]: current }));
      } finally {
        setIsSaving(false);
      }
    },
    [config, data],
  );

  // Shopping Lists
  const saveShoppingList = useCallback(
    async (list: ShoppingList, userName: string) => {
      const isNew = !data.shoppingLists[list.id];
      await saveToCollection('shoppingLists', 'shopping-lists', list);
      await addChangelog({
        entityType: 'shoppingList',
        entityId: list.id,
        entityTitle: list.title,
        action: isNew ? 'create' : 'update',
        performedBy: userName,
        summary: isNew
          ? `Vytvořil/a seznam "${list.title}"`
          : `Upravil/a seznam "${list.title}"`,
      });
    },
    [data.shoppingLists, saveToCollection, addChangelog],
  );

  const deleteShoppingList = useCallback(
    async (id: string, userName: string) => {
      const title = data.shoppingLists[id]?.title ?? id;
      await deleteFromCollection<ShoppingList>('shoppingLists', 'shopping-lists', id);
      await addChangelog({
        entityType: 'shoppingList',
        entityId: id,
        entityTitle: title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a seznam "${title}"`,
      });
    },
    [data.shoppingLists, deleteFromCollection, addChangelog],
  );

  // Tasks
  const saveTask = useCallback(
    async (task: Task, userName: string) => {
      const isNew = !data.tasks[task.id];
      await saveToCollection('tasks', 'tasks', task);
      await addChangelog({
        entityType: 'task',
        entityId: task.id,
        entityTitle: task.title,
        action: isNew ? 'create' : 'update',
        performedBy: userName,
        summary: isNew
          ? `Vytvořil/a úkol "${task.title}"`
          : `Upravil/a úkol "${task.title}"`,
      });
    },
    [data.tasks, saveToCollection, addChangelog],
  );

  const deleteTask = useCallback(
    async (id: string, userName: string) => {
      const title = data.tasks[id]?.title ?? id;
      await deleteFromCollection<Task>('tasks', 'tasks', id);
      await addChangelog({
        entityType: 'task',
        entityId: id,
        entityTitle: title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a úkol "${title}"`,
      });
    },
    [data.tasks, deleteFromCollection, addChangelog],
  );

  // Notes
  const saveNote = useCallback(
    async (note: Note, userName: string) => {
      const isNew = !data.notes[note.id];
      await saveToCollection('notes', 'notes', note);
      await addChangelog({
        entityType: 'note',
        entityId: note.id,
        entityTitle: note.title,
        action: isNew ? 'create' : 'update',
        performedBy: userName,
        summary: isNew
          ? `Vytvořil/a poznámku "${note.title}"`
          : `Upravil/a poznámku "${note.title}"`,
      });
    },
    [data.notes, saveToCollection, addChangelog],
  );

  const deleteNote = useCallback(
    async (id: string, userName: string) => {
      const title = data.notes[id]?.title ?? id;
      await deleteFromCollection<Note>('notes', 'notes', id);
      await addChangelog({
        entityType: 'note',
        entityId: id,
        entityTitle: title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a poznámku "${title}"`,
      });
    },
    [data.notes, deleteFromCollection, addChangelog],
  );

  // Tags
  const saveTag = useCallback(
    async (tag: Tag) => {
      await saveToCollection('tags', 'tags', tag);
    },
    [saveToCollection],
  );

  const deleteTag = useCallback(
    async (id: string) => {
      await deleteFromCollection<Tag>('tags', 'tags', id);
    },
    [deleteFromCollection],
  );

  // Users
  const saveUser = useCallback(
    async (user: User) => {
      await saveToCollection('users', 'users', user);
    },
    [saveToCollection],
  );

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        isSaving,
        error,
        refresh,
        saveShoppingList,
        deleteShoppingList,
        saveTask,
        deleteTask,
        saveNote,
        deleteNote,
        saveTag,
        deleteTag,
        saveUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export { generateId };
