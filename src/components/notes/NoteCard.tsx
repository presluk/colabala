import type { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onPin: () => void;
}

export default function NoteCard({ note, onClick, onPin }: NoteCardProps) {
  const preview =
    note.content.length > 100
      ? note.content.slice(0, 100) + '...'
      : note.content;

  const formattedDate = note.lastEditedAt
    ? new Date(note.lastEditedAt).toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer transition-all hover:shadow-md ${
        note.pinned ? 'bg-yellow-50' : 'bg-white'
      }`}
    >
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPin();
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-md transition-all cursor-pointer ${
          note.pinned
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100'
            : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50'
        }`}
        title={note.pinned ? 'Odepnout' : 'Připnout'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M16 2a1 1 0 00-.707.293l-3.586 3.586-2.414-.828a1 1 0 00-1 .242l-2 2a1 1 0 00.121 1.535L9.586 11l-5.293 5.293a1 1 0 101.414 1.414L11 12.414l2.172 2.172a1 1 0 001.535.12l2-2a1 1 0 00.242-1l-.828-2.413 3.586-3.586A1 1 0 0020 4.586l-1.586-1.586-.707-.707A1 1 0 0016 2z" />
        </svg>
      </button>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 pr-8 mb-2 line-clamp-1">
        {note.title || 'Bez názvu'}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-3 min-h-[3rem]">
        {preview || 'Prázdná poznámka'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{note.createdBy}</span>
        {formattedDate && <span>{formattedDate}</span>}
      </div>
    </div>
  );
}
