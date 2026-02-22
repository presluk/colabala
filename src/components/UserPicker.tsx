import { useState } from 'react';
import { useData, generateId } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import type { User } from '../types';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function UserPicker() {
  const { data, saveUser, deleteUser } = useData();
  const { setCurrentUser } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const users = Object.values(data.users);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleSaveNewUser = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const user: User = {
      id: generateId(),
      name: trimmed,
      color: newColor,
      role: newIsAdmin ? 'admin' : 'user',
    };

    await saveUser(user);
    setCurrentUser(user);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    setNewIsAdmin(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">
          Kdo jsi?
        </h1>

        {users.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {users.map((user) => (
              <div key={user.id} className="relative group">
                <button
                  onClick={() => handleSelectUser(user)}
                  className="flex flex-col items-center gap-2 p-4 w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition cursor-pointer"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {user.name}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">
                      Admin
                    </span>
                  )}
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 shadow-sm"
                  title="Smazat uživatele"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 py-4 font-medium transition"
          >
            + Přidat uživatele
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <label
                htmlFor="new-user-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Jméno
              </label>
              <input
                id="new-user-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                placeholder="Tvoje jméno"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barva
              </label>
              <div className="flex gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {newColor === color && (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="new-user-admin"
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <label
                htmlFor="new-user-admin"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Admin
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-2.5 font-medium transition"
              >
                Zrušit
              </button>
              <button
                onClick={handleSaveNewUser}
                disabled={!newName.trim()}
                className="flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white py-2.5 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Uložit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
