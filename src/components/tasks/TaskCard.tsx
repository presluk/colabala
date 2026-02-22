import type { Task, User } from '../../types';

interface TaskCardProps {
  task: Task;
  users: Record<string, User>;
  onStatusChange: (status: Task['status']) => void;
  onClick: () => void;
}

const priorityConfig: Record<Task['priority'], { label: string; classes: string }> = {
  low: { label: 'Nizka', classes: 'bg-green-100 text-green-800' },
  medium: { label: 'Stredni', classes: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Vysoka', classes: 'bg-red-100 text-red-800' },
};

const statusConfig: Record<Task['status'], { label: string; classes: string }> = {
  todo: { label: 'K udelani', classes: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  in_progress: { label: 'Rozpracovano', classes: 'bg-blue-100 text-blue-700' },
  done: { label: 'Hotovo', classes: 'bg-green-100 text-green-700' },
};

const statusFlow: Task['status'][] = ['todo', 'in_progress', 'done'];

function isOverdue(deadline: string | undefined): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deadline) < today;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ');
}

export default function TaskCard({ task, users, onStatusChange, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const assignees = (task.assignedToIds ?? (task.assignedTo ? [task.assignedTo] : []))
    .map((id) => users[id])
    .filter(Boolean);
  const overdue = task.status !== 'done' && isOverdue(task.deadline);
  const currentIdx = statusFlow.indexOf(task.status);

  const MAX_AVATARS = 3;
  const visibleAssignees = assignees.slice(0, MAX_AVATARS);
  const overflowCount = assignees.length - MAX_AVATARS;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Top row: title + badges */}
      <div className="flex items-start justify-between gap-3">
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.classes}`}>
            {priority.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
      )}

      {/* Bottom row: meta + status controls */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 min-w-0">
          {/* Assignees - stacked avatars */}
          {assignees.length > 0 && (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="flex -space-x-1.5">
                {visibleAssignees.map((user) => (
                  <span
                    key={user.id}
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-400 bg-gray-200 ring-2 ring-white dark:ring-gray-800"
                    title={assignees.slice(MAX_AVATARS).map((u) => u.name).join(', ')}
                  >
                    +{overflowCount}
                  </span>
                )}
              </span>
              <span className="truncate">
                {assignees.length === 1
                  ? assignees[0].name
                  : `${assignees.length} osob`}
              </span>
            </span>
          )}

          {/* Deadline */}
          {task.deadline && (
            <span className={`shrink-0 ${overdue ? 'text-red-600 font-medium' : ''}`}>
              {overdue ? 'Po terminu: ' : 'Termin: '}
              {formatDate(task.deadline)}
            </span>
          )}
        </div>

        {/* Status quick-change buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {currentIdx > 0 && (
            <button
              type="button"
              title={statusConfig[statusFlow[currentIdx - 1]].label}
              onClick={() => onStatusChange(statusFlow[currentIdx - 1])}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIdx < statusFlow.length - 1 && (
            <button
              type="button"
              title={statusConfig[statusFlow[currentIdx + 1]].label}
              onClick={() => onStatusChange(statusFlow[currentIdx + 1])}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
