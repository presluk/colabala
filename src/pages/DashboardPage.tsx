import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import ChangelogTimeline from '../components/changelog/ChangelogTimeline';

export default function DashboardPage() {
  const { data } = useData();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';
  const [showAllActivity, setShowAllActivity] = useState(isAdmin);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const lists = Object.values(data.shoppingLists);
    const tasks = Object.values(data.tasks);
    const notes = Object.values(data.notes);

    return {
      activeLists: lists.length,
      inProgressTasks: tasks.filter((t) => t.status !== 'done').length,
      totalNotes: notes.length,
    };
  }, [data.shoppingLists, data.tasks, data.notes]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);

    return Object.values(data.tasks)
      .filter((t) => t.status !== 'done' && t.deadline)
      .filter((t) => {
        const d = new Date(t.deadline!);
        return d <= weekFromNow;
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [data.tasks]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Přehled</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/shopping')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Nákupní seznamy</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{stats.activeLists}</p>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktivní úkoly</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{stats.inProgressTasks}</p>
        </button>
        <button
          onClick={() => navigate('/notes')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Poznámky</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalNotes}</p>
        </button>
      </div>

      {/* Upcoming deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Blížící se termíny</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            {upcomingDeadlines.map((task) => {
              const isOverdue = new Date(task.deadline!) < new Date();
              return (
                <div key={task.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                    {(() => {
                      const ids = task.assignedToIds ?? (task.assignedTo ? [task.assignedTo] : []);
                      const names = ids.map((id) => data.users[id]?.name).filter(Boolean);
                      return names.length > 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{names.join(', ')}</p>
                      ) : null;
                    })()}
                  </div>
                  <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(task.deadline!).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Poslední aktivita</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showAllActivity ? 'Zobrazit moje' : 'Zobrazit vše'}
            </button>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <ChangelogTimeline
            entries={data.changelog}
            limit={20}
            filterByUserId={currentUser?.id ?? null}
            isAdmin={isAdmin}
            showAll={showAllActivity}
          />
        </div>
      </div>
    </div>
  );
}
