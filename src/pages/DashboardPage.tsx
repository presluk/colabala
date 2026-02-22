import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import ChangelogTimeline from '../components/changelog/ChangelogTimeline';
import type { User } from '../types';

export default function DashboardPage() {
  const { data, deleteUser, saveUser } = useData();
  const { currentUser, setCurrentUser } = useUser();
  // Use live data for role check — localStorage snapshot may be stale
  const liveUser = currentUser ? data.users[currentUser.id] : null;
  const isAdmin = (liveUser?.role ?? currentUser?.role) === 'admin';
  // If no admins exist at all, let any user access the management section to bootstrap
  const hasAnyAdmin = Object.values(data.users).some((u) => u.role === 'admin');
  const canManageUsers = isAdmin || !hasAnyAdmin;
  const [showAllActivity, setShowAllActivity] = useState(isAdmin);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const userName = currentUser?.name ?? 'Anonym';

  const handleToggleAdmin = async (user: User) => {
    const updated = { ...user, role: user.role === 'admin' ? 'user' as const : 'admin' as const };
    await saveUser(updated);
    // If toggling own role, update current user session
    if (currentUser && user.id === currentUser.id) {
      setCurrentUser(updated);
    }
  };

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

      {/* User management — always visible */}
      <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Správa uživatelů
            {!hasAnyAdmin && (
              <span className="ml-2 text-sm font-normal text-amber-600">
                (Zatím není žádný admin — přiřaďte si roli)
              </span>
            )}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            {Object.values(data.users).map((user: User) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Toggle admin role — for admins, or for anyone during bootstrap */}
                  {canManageUsers && (
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      className={`text-xs font-medium cursor-pointer ${
                        user.role === 'admin'
                          ? 'text-amber-600 hover:text-amber-700'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {user.role === 'admin' ? 'Odebrat admina' : 'Nastavit admina'}
                    </button>
                  )}
                  {/* Delete — only for other users, only for admins */}
                  {isAdmin && user.id !== currentUser?.id && (
                    confirmDeleteId === user.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Smazat?</span>
                        <button
                          onClick={async () => {
                            await deleteUser(user.id, userName);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          Ano
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                        >
                          Ne
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
                      >
                        Smazat
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

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
