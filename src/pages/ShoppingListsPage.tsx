import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, generateId } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import type { ShoppingList } from '../types';

export default function ShoppingListsPage() {
  const { data, saveShoppingList } = useData();
  const { currentUser } = useUser();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showOthers, setShowOthers] = useState(false);

  const { myLists, otherLists } = useMemo(() => {
    const all = Object.values(data.shoppingLists).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!currentUser) return { myLists: all, otherLists: [] };
    const mine: ShoppingList[] = [];
    const others: ShoppingList[] = [];
    for (const list of all) {
      const ids = list.assignedToIds ?? [];
      if (ids.length === 0 || ids.includes(currentUser.id)) {
        mine.push(list);
      } else {
        others.push(list);
      }
    }
    return { myLists: mine, otherLists: others };
  }, [data.shoppingLists, currentUser]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || !currentUser) return;

    const list: ShoppingList = {
      id: generateId(),
      title: trimmed,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      tags: [],
      items: {},
      assignedToIds: [],
    };

    await saveShoppingList(list, currentUser.name);
    setNewTitle('');
    setShowForm(false);
  };

  const getItemCounts = (list: ShoppingList) => {
    const items = Object.values(list.items);
    return {
      total: items.length,
      checked: items.filter((i) => i.checked).length,
    };
  };

  function renderListCard(list: ShoppingList) {
    const { total, checked } = getItemCounts(list);
    const listTags = list.tags
      .map((tagId) => data.tags[tagId])
      .filter(Boolean);
    const assignees = (list.assignedToIds ?? [])
      .map((id) => data.users[id])
      .filter(Boolean);

    return (
      <button
        key={list.id}
        onClick={() => navigate(`/shopping/${list.id}`)}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer group"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors truncate">
          {list.title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {checked}/{total} polozek
          </span>
          {total > 0 && (
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{
                  width: `${total > 0 ? (checked / total) * 100 : 0}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Assignee avatars */}
        {assignees.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex -space-x-1">
              {assignees.slice(0, 3).map((user) => (
                <span
                  key={user.id}
                  className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ))}
              {assignees.length > 3 && (
                <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-400 bg-gray-200 ring-2 ring-white dark:ring-gray-800">
                  +{assignees.length - 3}
                </span>
              )}
            </span>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          {list.createdBy}
        </p>

        {listTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Nákupní seznamy
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/50 focus:outline-none transition-colors cursor-pointer"
        >
          Nový seznam
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Název seznamu
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="napr. Vikendovy nakup"
              autoFocus
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors dark:bg-gray-800"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Ulozit
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewTitle('');
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors cursor-pointer"
            >
              Zrusit
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {myLists.length === 0 && otherLists.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Zatim zadne seznamy. Vytvorte prvni!
          </p>
        </div>
      )}

      {/* My shopping lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myLists.map(renderListCard)}
      </div>

      {/* Others section */}
      {otherLists.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowOthers(!showOthers)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${showOthers ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Ostatní ({otherLists.length})
          </button>
          {showOthers && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherLists.map(renderListCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
