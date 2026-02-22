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
  TrashItem,
} from '../types';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import { readJsonFile, writeJsonFile } from '../services/github';

type DataCollection = keyof Omit<AppData, 'changelog' | 'trash'>;

interface Shas {
  'shopping-lists': string | null;
  tasks: string | null;
  notes: string | null;
  tags: string | null;
  users: string | null;
  changelog: string | null;
  trash: string | null;
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
  deleteUser: (id: string, userName: string) => Promise<void>;

  // Trash
  restoreFromTrash: (trashId: string, userName: string) => Promise<void>;
  permanentDelete: (trashId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

const emptyData: AppData = {
  shoppingLists: {},
  tasks: {},
  notes: {},
  tags: {},
  users: {},
  changelog: [],
  trash: [],
};

const DataContext = createContext<DataState | null>(null);

const REFRESH_INTERVAL = 30_000;

export function DataProvider({ children }: { children: ReactNode }) {
  const { config } = useAuth();
  const { syncWithLiveData } = useUser();
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
    trash: null,
  });

  const loadAll = useCallback(async () => {
    if (!config) return;
    try {
      const [sl, t, n, tg, u, cl, tr] = await Promise.all([
        readJsonFile<Record<string, ShoppingList>>(config, 'shopping-lists', {}),
        readJsonFile<Record<string, Task>>(config, 'tasks', {}),
        readJsonFile<Record<string, Note>>(config, 'notes', {}),
        readJsonFile<Record<string, Tag>>(config, 'tags', {}),
        readJsonFile<Record<string, User>>(config, 'users', {}),
        readJsonFile<ChangelogEntry[]>(config, 'changelog', []),
        readJsonFile<TrashItem[]>(config, 'trash', []),
      ]);

      shas.current = {
        'shopping-lists': sl.sha,
        tasks: t.sha,
        notes: n.sha,
        tags: tg.sha,
        users: u.sha,
        changelog: cl.sha,
        trash: tr.sha,
      };

      // Normalize users: add default role if missing
      const normalizedUsers = { ...u.data };
      for (const user of Object.values(normalizedUsers)) {
        if (!user.role) (user as User).role = 'user';
      }

      // Normalize tasks: migrate assignedTo → assignedToIds, init completedByIds
      const normalizedTasks = { ...t.data };
      for (const task of Object.values(normalizedTasks)) {
        if (!task.assignedToIds) {
          (task as Task).assignedToIds = task.assignedTo ? [task.assignedTo] : [];
        }
        if (!task.completedByIds) {
          (task as Task).completedByIds = [];
        }
      }

      // Normalize shopping lists: add assignedToIds
      const normalizedLists = { ...sl.data };
      for (const list of Object.values(normalizedLists)) {
        if (!list.assignedToIds) {
          (list as ShoppingList).assignedToIds = [];
        }
      }

      setData({
        shoppingLists: normalizedLists,
        tasks: normalizedTasks,
        notes: n.data,
        tags: tg.data,
        users: normalizedUsers,
        changelog: cl.data,
        trash: tr.data,
      });
      syncWithLiveData(normalizedUsers);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba načítání dat');
    }
  }, [config, syncWithLiveData]);

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
      const updated = [...data.changelog, full].slice(-200);
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

  const saveTrash = useCallback(
    async (trash: TrashItem[]) => {
      if (!config) return;
      const newSha = await writeJsonFile(
        config,
        'trash',
        trash,
        `[Colabala] Aktualizace koše`,
        shas.current.trash ?? undefined,
      );
      shas.current.trash = newSha;
      setData((prev) => ({ ...prev, trash }));
    },
    [config],
  );

  const addToTrash = useCallback(
    async (entityType: TrashItem['entityType'], entityData: ShoppingList | Task | Note, deletedBy: string) => {
      const trashItem: TrashItem = {
        id: generateId(),
        entityType,
        data: entityData,
        deletedBy,
        deletedAt: new Date().toISOString(),
      };
      const updated = [...data.trash, trashItem].slice(-50); // Keep last 50
      await saveTrash(updated);
    },
    [data.trash, saveTrash],
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

  // Helper: resolve userName to userId
  const findUserId = useCallback(
    (userName: string): string | undefined =>
      Object.values(data.users).find((u) => u.name === userName)?.id,
    [data.users],
  );

  // Helper: deduplicated relevant user IDs for changelog
  const buildRelevantIds = useCallback(
    (userName: string, assignedToIds: string[]): string[] => {
      const ids = new Set(assignedToIds);
      const performerId = findUserId(userName);
      if (performerId) ids.add(performerId);
      return [...ids];
    },
    [findUserId],
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
        relevantUserIds: buildRelevantIds(userName, list.assignedToIds ?? []),
      });
    },
    [data.shoppingLists, saveToCollection, addChangelog, buildRelevantIds],
  );

  const deleteShoppingList = useCallback(
    async (id: string, userName: string) => {
      const item = data.shoppingLists[id];
      if (!item) return;
      await addToTrash('shoppingList', item, userName);
      await deleteFromCollection<ShoppingList>('shoppingLists', 'shopping-lists', id);
      await addChangelog({
        entityType: 'shoppingList',
        entityId: id,
        entityTitle: item.title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a seznam "${item.title}"`,
        relevantUserIds: buildRelevantIds(userName, item.assignedToIds ?? []),
      });
    },
    [data.shoppingLists, deleteFromCollection, addChangelog, addToTrash, buildRelevantIds],
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
        relevantUserIds: buildRelevantIds(userName, task.assignedToIds ?? []),
      });
    },
    [data.tasks, saveToCollection, addChangelog, buildRelevantIds],
  );

  const deleteTask = useCallback(
    async (id: string, userName: string) => {
      const item = data.tasks[id];
      if (!item) return;
      await addToTrash('task', item, userName);
      await deleteFromCollection<Task>('tasks', 'tasks', id);
      await addChangelog({
        entityType: 'task',
        entityId: id,
        entityTitle: item.title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a úkol "${item.title}"`,
        relevantUserIds: buildRelevantIds(userName, item.assignedToIds ?? []),
      });
    },
    [data.tasks, deleteFromCollection, addChangelog, addToTrash, buildRelevantIds],
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
        relevantUserIds: buildRelevantIds(userName, []),
      });
    },
    [data.notes, saveToCollection, addChangelog, buildRelevantIds],
  );

  const deleteNote = useCallback(
    async (id: string, userName: string) => {
      const item = data.notes[id];
      if (!item) return;
      await addToTrash('note', item, userName);
      await deleteFromCollection<Note>('notes', 'notes', id);
      await addChangelog({
        entityType: 'note',
        entityId: id,
        entityTitle: item.title,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a poznámku "${item.title}"`,
        relevantUserIds: buildRelevantIds(userName, []),
      });
    },
    [data.notes, deleteFromCollection, addChangelog, addToTrash, buildRelevantIds],
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

  const deleteUser = useCallback(
    async (id: string, userName: string) => {
      const user = data.users[id];
      await deleteFromCollection<User>('users', 'users', id);
      await addChangelog({
        entityType: 'user',
        entityId: id,
        entityTitle: user?.name ?? id,
        action: 'delete',
        performedBy: userName,
        summary: `Smazal/a uživatele „${user?.name ?? id}"`,
        relevantUserIds: [],
      });
    },
    [data.users, deleteFromCollection, addChangelog],
  );

  // Trash operations
  const restoreFromTrash = useCallback(
    async (trashId: string, userName: string) => {
      const trashItem = data.trash.find((t) => t.id === trashId);
      if (!trashItem) return;

      // Restore to original collection
      if (trashItem.entityType === 'shoppingList') {
        await saveToCollection('shoppingLists', 'shopping-lists', trashItem.data as ShoppingList);
      } else if (trashItem.entityType === 'task') {
        await saveToCollection('tasks', 'tasks', trashItem.data as Task);
      } else if (trashItem.entityType === 'note') {
        await saveToCollection('notes', 'notes', trashItem.data as Note);
      }

      // Remove from trash
      const updated = data.trash.filter((t) => t.id !== trashId);
      await saveTrash(updated);

      const restoredAssignees =
        (trashItem.data as { assignedToIds?: string[] }).assignedToIds ?? [];
      await addChangelog({
        entityType: trashItem.entityType,
        entityId: (trashItem.data as { id: string }).id,
        entityTitle: (trashItem.data as { title: string }).title,
        action: 'create',
        performedBy: userName,
        summary: `Obnovil/a "${(trashItem.data as { title: string }).title}" z koše`,
        relevantUserIds: buildRelevantIds(userName, restoredAssignees),
      });
    },
    [data.trash, saveToCollection, saveTrash, addChangelog, buildRelevantIds],
  );

  const permanentDelete = useCallback(
    async (trashId: string) => {
      const updated = data.trash.filter((t) => t.id !== trashId);
      await saveTrash(updated);
    },
    [data.trash, saveTrash],
  );

  const emptyTrash = useCallback(async () => {
    await saveTrash([]);
  }, [saveTrash]);

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
        deleteUser,
        restoreFromTrash,
        permanentDelete,
        emptyTrash,
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
