import type { ShoppingItem as ShoppingItemType } from '../../types';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: () => void;
  onDelete: () => void;
}

export default function ShoppingItem({ item, onToggle, onDelete }: ShoppingItemProps) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        item.checked
          ? 'bg-gray-50 dark:bg-gray-900 opacity-70'
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={onToggle}
        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer shrink-0"
      />

      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm ${
            item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {item.text}
        </span>
        <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {item.addedBy}
          {item.checked && item.checkedBy && (
            <> &middot; odskrtnul/a {item.checkedBy}</>
          )}
        </span>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        title="Smazat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
