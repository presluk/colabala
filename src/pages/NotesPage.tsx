import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import NoteCard from '../components/notes/NoteCard';

export default function NotesPage() {
  const { data, saveNote } = useData();
  const { currentUser } = useUser();
  const navigate = useNavigate();

  const { pinned, regular } = useMemo(() => {
    const all = Object.values(data.notes);
    const pinnedNotes = all
      .filter((n) => n.pinned)
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt).getTime() -
          new Date(a.lastEditedAt).getTime(),
      );
    const regularNotes = all
      .filter((n) => !n.pinned)
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt).getTime() -
          new Date(a.lastEditedAt).getTime(),
      );
    return { pinned: pinnedNotes, regular: regularNotes };
  }, [data.notes]);

  const handlePin = async (noteId: string) => {
    const note = data.notes[noteId];
    if (!note || !currentUser) return;
    await saveNote(
      { ...note, pinned: !note.pinned },
      currentUser.name,
    );
  };

  const isEmpty = pinned.length === 0 && regular.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Poznámky</h1>
        <button
          onClick={() => navigate('/notes/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-lg transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nová poznámka
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Zatím žádné poznámky</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Vytvořte první poznámku kliknutím na tlačítko výše.
          </p>
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Připnuté
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/notes/${note.id}`)}
                onPin={() => handlePin(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular notes */}
      {regular.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Ostatní
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regular.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/notes/${note.id}`)}
                onPin={() => handlePin(note.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
