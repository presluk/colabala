import type { User, Task } from '../../types';

export interface TaskFilterValues {
  status: Task['status'] | 'all';
  priority: Task['priority'] | 'all';
  assignedTo: string; // user id or 'all'
}

interface TaskFiltersProps {
  filters: TaskFilterValues;
  users: Record<string, User>;
  onChange: (filters: TaskFilterValues) => void;
}

const statusOptions: { value: TaskFilterValues['status']; label: string }[] = [
  { value: 'all', label: 'Vse' },
  { value: 'todo', label: 'K udelani' },
  { value: 'in_progress', label: 'Rozpracovano' },
  { value: 'done', label: 'Hotovo' },
];

const priorityOptions: { value: TaskFilterValues['priority']; label: string }[] = [
  { value: 'all', label: 'Vse' },
  { value: 'low', label: 'Nizka' },
  { value: 'medium', label: 'Stredni' },
  { value: 'high', label: 'Vysoka' },
];

export default function TaskFilters({ filters, users, onChange }: TaskFiltersProps) {
  const userList = Object.values(users);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Status filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Stav
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, status: opt.value })}
              className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                filters.status === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Priorita
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, priority: opt.value })}
              className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                filters.priority === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Prirazeno
        </label>
        <select
          value={filters.assignedTo}
          onChange={(e) => onChange({ ...filters, assignedTo: e.target.value })}
          className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Vse</option>
          {userList.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
