import { useState, useMemo } from 'react';
import { useData, generateId } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import type { Task } from '../types';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import TaskFilters, { type TaskFilterValues } from '../components/tasks/TaskFilters';

export default function TasksPage() {
  const { data, saveTask, deleteTask } = useData();
  const { currentUser } = useUser();

  const [filters, setFilters] = useState<TaskFilterValues>({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  // For multi-assignee tasks, derive an effective status from current user's perspective
  const effectiveStatus = (t: Task): Task['status'] => {
    const isMulti = (t.assignedToIds ?? []).length >= 2;
    if (!isMulti || !currentUser) return t.status;
    const completed = (t.completedByIds ?? []).includes(currentUser.id);
    if (completed) return 'done';
    const anyCompleted = (t.completedByIds ?? []).length > 0;
    return anyCompleted ? 'in_progress' : 'todo';
  };

  const filtered = useMemo(() => {
    return Object.values(data.tasks)
      .filter((t) => filters.status === 'all' || effectiveStatus(t) === filters.status)
      .filter((t) => filters.priority === 'all' || t.priority === filters.priority)
      .filter((t) => filters.assignedTo === 'all' || (t.assignedToIds ?? []).includes(filters.assignedTo))
      .sort((a, b) => {
        const statusOrder = { todo: 0, in_progress: 1, done: 2 };
        const sd = statusOrder[effectiveStatus(a)] - statusOrder[effectiveStatus(b)];
        if (sd !== 0) return sd;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [data.tasks, filters, currentUser]);

  const userName = currentUser?.name ?? 'Anonym';

  const handleSave = async (taskData: Task) => {
    const task: Task = {
      ...taskData,
      id: taskData.id || generateId(),
      createdBy: taskData.createdBy || userName,
      createdAt: taskData.createdAt || new Date().toISOString(),
    };
    await saveTask(task, userName);
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    const task = data.tasks[taskId];
    if (!task) return;
    await saveTask({ ...task, status }, userName);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const task = data.tasks[taskId];
    if (!task || !currentUser) return;

    const completedByIds = task.completedByIds ?? [];
    const isCompleted = completedByIds.includes(currentUser.id);
    const newCompletedByIds = isCompleted
      ? completedByIds.filter((id) => id !== currentUser.id)
      : [...completedByIds, currentUser.id];

    const assigneeCount = (task.assignedToIds ?? []).length;
    let newStatus: Task['status'];
    if (newCompletedByIds.length === assigneeCount) {
      newStatus = 'done';
    } else if (newCompletedByIds.length > 0) {
      newStatus = 'in_progress';
    } else {
      newStatus = 'todo';
    }

    await saveTask({ ...task, completedByIds: newCompletedByIds, status: newStatus }, userName);
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId, userName);
    setEditingTask(undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Úkoly</h1>
        <button
          onClick={() => { setEditingTask(undefined); setShowForm(true); }}
          className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition cursor-pointer"
        >
          Nový úkol
        </button>
      </div>

      <div className="mb-6">
        <TaskFilters filters={filters} users={data.users} onChange={setFilters} />
      </div>

      {(showForm || editingTask) && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <TaskForm
            task={editingTask}
            users={data.users}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingTask(undefined); }}
          />
          {editingTask && (
            <button
              onClick={() => handleDelete(editingTask.id)}
              className="mt-3 text-sm text-red-500 hover:text-red-600 cursor-pointer"
            >
              Smazat úkol
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">Žádné úkoly k zobrazení</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            users={data.users}
            currentUserId={currentUser?.id}
            onStatusChange={(status) => handleStatusChange(task.id, status)}
            onToggleCompletion={() => handleToggleCompletion(task.id)}
            onClick={() => { setEditingTask(task); setShowForm(false); }}
          />
        ))}
      </div>
    </div>
  );
}
