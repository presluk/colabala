import type { Task, User } from '../../types';

interface TaskCardProps {
  task: Task;
  users: Record<string, User>;
  currentUserId?: string;
  onStatusChange: (status: Task['status']) => void;
  onToggleCompletion?: () => void;
  onClick: () => void;
}

const priorityConfig: Record<Task['priority'], { label: string; classes: string }> = {
  low: { label: 'Nizka', classes: 'bg-green-100 text-green-800' },
  medium: { label: 'Stredni', classes: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Vysoka', classes: 'bg-red-100 text-red-800' },
};

const statusConfig: Record<Task['status'], { label: string; classes: string; hoverClasses: string }> = {
  todo: { label: 'K udělání', classes: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', hoverClasses: 'hover:bg-gray-200 dark:hover:bg-gray-600' },
  in_progress: { label: 'Rozpracováno', classes: 'bg-blue-100 text-blue-700', hoverClasses: 'hover:bg-blue-200' },
  done: { label: 'Hotovo', classes: 'bg-green-100 text-green-700', hoverClasses: 'hover:bg-green-200' },
};

function isOverdue(deadline: string | undefined): boolean {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(deadline) < today;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ');
}

export default function TaskCard({ task, users, currentUserId, onStatusChange, onToggleCompletion, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const assignees = (task.assignedToIds ?? (task.assignedTo ? [task.assignedTo] : []))
    .map((id) => users[id])
    .filter(Boolean);
  const completedByIds = task.completedByIds ?? [];
  const isMultiAssignee = assignees.length >= 2;
  const currentUserCompleted = currentUserId ? completedByIds.includes(currentUserId) : false;

  // For multi-assignee tasks, "done" is per-user; for single, use global status
  const effectivelyDone = isMultiAssignee ? currentUserCompleted : task.status === 'done';
  const overdue = !effectivelyDone && isOverdue(task.deadline);

  const MAX_AVATARS = 3;
  const visibleAssignees = assignees.slice(0, MAX_AVATARS);
  const overflowCount = assignees.length - MAX_AVATARS;

  const nextStatus: Task['status'] =
    task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';

  const completionCount = completedByIds.length;
  const completionTotal = assignees.length;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Top row: title + badges */}
      <div className="flex items-start justify-between gap-3">
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${effectivelyDone ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.classes}`}>
            {priority.label}
          </span>
          {/* Clickable status badge — per-user toggle for multi-assignee, cycle for single */}
          {isMultiAssignee ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompletion?.();
              }}
              title={currentUserCompleted ? 'Klikni → zrušit dokončení' : 'Klikni → označit jako hotovo'}
              className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                completionCount === completionTotal
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : completionCount > 0
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {completionCount}/{completionTotal} hotovo
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(nextStatus);
              }}
              title={`Klikni → ${statusConfig[nextStatus].label}`}
              className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${status.classes} ${status.hoverClasses}`}
            >
              {status.label}
            </button>
          )}
        </div>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
      )}

      {/* Bottom row: meta */}
      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 min-w-0">
        {/* Assignees - stacked avatars */}
        {assignees.length > 0 && (
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="flex -space-x-1.5">
              {visibleAssignees.map((user) => (
                <span
                  key={user.id}
                  className="relative w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800"
                  style={{ backgroundColor: user.color }}
                  title={`${user.name}${isMultiAssignee && completedByIds.includes(user.id) ? ' (hotovo)' : ''}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                  {isMultiAssignee && completedByIds.includes(user.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center ring-1 ring-white dark:ring-gray-800">
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
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
            {overdue ? 'Po termínu: ' : 'Termín: '}
            {formatDate(task.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
