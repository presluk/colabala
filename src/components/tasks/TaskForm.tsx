import { useState } from 'react';
import type { Task, User } from '../../types';

interface TaskFormProps {
  task?: Task;
  users: Record<string, User>;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const statusOptions: { value: Task['status']; label: string }[] = [
  { value: 'todo', label: 'K udelani' },
  { value: 'in_progress', label: 'Rozpracovano' },
  { value: 'done', label: 'Hotovo' },
];

const priorityOptions: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Nizka' },
  { value: 'medium', label: 'Stredni' },
  { value: 'high', label: 'Vysoka' },
];

export default function TaskForm({ task, users, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<Task['status']>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [assignedToIds, setAssignedToIds] = useState<string[]>(
    task?.assignedToIds ?? (task?.assignedTo ? [task.assignedTo] : []),
  );
  const [deadline, setDeadline] = useState(task?.deadline ?? '');

  const userList = Object.values(users);

  const toggleUser = (userId: string) => {
    setAssignedToIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: task?.id ?? '',
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignedTo: assignedToIds[0] ?? undefined,
      assignedToIds,
      createdBy: task?.createdBy ?? '',
      createdAt: task?.createdAt ?? '',
      deadline: deadline || undefined,
      tags: task?.tags ?? [],
    });
  };

  const inputClasses =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nazev */}
      <div>
        <label className={labelClasses}>Nazev *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nazev ukolu..."
          required
          className={inputClasses}
          autoFocus
        />
      </div>

      {/* Popis */}
      <div>
        <label className={labelClasses}>Popis</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Popis ukolu..."
          rows={3}
          className={inputClasses}
        />
      </div>

      {/* Row: Stav + Priorita */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Stav</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Task['status'])}
            className={inputClasses}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Priorita</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
            className={inputClasses}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row: Prirazeno + Termin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Prirazeno</label>
          <div className="space-y-1.5 mt-1">
            {userList.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={assignedToIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
              </label>
            ))}
            {userList.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">Zatim zadni uzivatele</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Termin</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          Zrusit
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Ulozit
        </button>
      </div>
    </form>
  );
}
