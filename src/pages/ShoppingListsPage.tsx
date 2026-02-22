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

  const lists = useMemo(
    () =>
      Object.values(data.shoppingLists).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data.shoppingLists],
  );

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
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
          className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Název seznamu
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="napr. Vikendovy nakup"
              autoFocus
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
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
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors cursor-pointer"
            >
              Zrusit
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {lists.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">
            Zatim zadne seznamy. Vytvorte prvni!
          </p>
        </div>
      )}

      {/* Shopping list grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => {
          const { total, checked } = getItemCounts(list);
          const listTags = list.tags
            .map((tagId) => data.tags[tagId])
            .filter(Boolean);

          return (
            <button
              key={list.id}
              onClick={() => navigate(`/shopping/${list.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                {list.title}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {checked}/{total} polozek
                </span>
                {total > 0 && (
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{
                        width: `${total > 0 ? (checked / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-400">
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
        })}
      </div>
    </div>
  );
}
