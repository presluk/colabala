import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, generateId } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import ShoppingItemRow from '../components/shopping/ShoppingItem';
import AddItemForm from '../components/shopping/AddItemForm';

export default function ShoppingListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, saveShoppingList, deleteShoppingList } = useData();
  const { currentUser } = useUser();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const list = id ? data.shoppingLists[id] : undefined;

  const { uncheckedItems, checkedItems } = useMemo(() => {
    if (!list) return { uncheckedItems: [], checkedItems: [] };
    const items = Object.values(list.items).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return {
      uncheckedItems: items.filter((i) => !i.checked),
      checkedItems: items.filter((i) => i.checked),
    };
  }, [list]);

  if (!list) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Seznam nebyl nalezen.</p>
        <button
          onClick={() => navigate('/shopping')}
          className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium cursor-pointer"
        >
          Zpet na seznamy
        </button>
      </div>
    );
  }

  const userName = currentUser?.name ?? 'Anonym';

  const handleTitleSave = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== list.title) {
      await saveShoppingList({ ...list, title: trimmed }, userName);
    }
    setIsEditingTitle(false);
  };

  const handleToggle = async (itemId: string) => {
    const item = list.items[itemId];
    if (!item) return;
    const updated = {
      ...list,
      items: {
        ...list.items,
        [itemId]: {
          ...item,
          checked: !item.checked,
          checkedBy: !item.checked ? userName : undefined,
        },
      },
    };
    await saveShoppingList(updated, userName);
  };

  const handleAddItem = async (text: string) => {
    const itemId = generateId();
    const maxSort = Math.max(
      0,
      ...Object.values(list.items).map((i) => i.sortOrder),
    );
    const updated = {
      ...list,
      items: {
        ...list.items,
        [itemId]: {
          id: itemId,
          text,
          checked: false,
          addedBy: userName,
          sortOrder: maxSort + 1,
        },
      },
    };
    await saveShoppingList(updated, userName);
  };

  const handleDeleteItem = async (itemId: string) => {
    const items = { ...list.items };
    delete items[itemId];
    await saveShoppingList({ ...list, items }, userName);
  };

  const handleDeleteList = async () => {
    await deleteShoppingList(list.id, userName);
    navigate('/shopping');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/shopping')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 cursor-pointer transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Zpet na seznamy
      </button>

      {/* Title */}
      <div className="mb-6">
        {isEditingTitle ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              className="flex-1 text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-primary-500 focus:outline-none bg-transparent py-1"
            />
            <button
              onClick={handleTitleSave}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
            >
              Ulozit
            </button>
            <button
              onClick={() => setIsEditingTitle(false)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium cursor-pointer"
            >
              Zrusit
            </button>
          </div>
        ) : (
          <h1
            onClick={() => {
              setEditedTitle(list.title);
              setIsEditingTitle(true);
            }}
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-primary-600 transition-colors"
            title="Klikni pro upravu"
          >
            {list.title}
          </h1>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Vytvoril/a {list.createdBy} &middot;{' '}
          {new Date(list.createdAt).toLocaleDateString('cs-CZ')}
        </p>
      </div>

      {/* Assignees */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Prirazeno
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.values(data.users).map((user) => {
            const assigned = (list.assignedToIds ?? []).includes(user.id);
            return (
              <button
                key={user.id}
                onClick={async () => {
                  const ids = list.assignedToIds ?? [];
                  const updated = assigned
                    ? ids.filter((uid) => uid !== user.id)
                    : [...ids, user.id];
                  await saveShoppingList({ ...list, assignedToIds: updated }, userName);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                  assigned
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
        {uncheckedItems.length === 0 && checkedItems.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            Seznam je prazdny. Pridejte prvni polozku.
          </div>
        )}

        {uncheckedItems.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={() => handleToggle(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
          />
        ))}

        {checkedItems.length > 0 && uncheckedItems.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Hotovo ({checkedItems.length})
            </span>
          </div>
        )}

        {checkedItems.map((item) => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={() => handleToggle(item.id)}
            onDelete={() => handleDeleteItem(item.id)}
          />
        ))}
      </div>

      {/* Add item form */}
      <div className="mt-4">
        <AddItemForm onAdd={handleAddItem} />
      </div>

      {/* Delete list */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleDeleteList}
          className="text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
        >
          Smazat cely seznam
        </button>
      </div>
    </div>
  );
}
