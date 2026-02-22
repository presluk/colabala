import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, generateId } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import ConfirmDialog from '../components/shared/ConfirmDialog';

function NoteForm({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data, saveNote, deleteNote } = useData();
  const { currentUser } = useUser();

  const isNew = noteId === 'new';
  const existing = !isNew ? data.notes[noteId] : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [showDelete, setShowDelete] = useState(false);

  const userName = currentUser?.name ?? 'Anonym';

  const handleSave = async () => {
    const now = new Date().toISOString();
    if (isNew) {
      const note = {
        id: generateId(),
        title: title.trim() || 'Bez názvu',
        content,
        createdBy: userName,
        createdAt: now,
        lastEditedBy: userName,
        lastEditedAt: now,
        tags: [],
        pinned,
      };
      await saveNote(note, userName);
      navigate('/notes');
    } else if (existing) {
      await saveNote({
        ...existing,
        title: title.trim() || 'Bez názvu',
        content,
        pinned,
        lastEditedBy: userName,
        lastEditedAt: now,
      }, userName);
      navigate('/notes');
    }
  };

  const handleDelete = async () => {
    if (existing) {
      await deleteNote(existing.id, userName);
    }
    navigate('/notes');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/notes')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 cursor-pointer"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Zpět na poznámky
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Název poznámky"
            className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100 border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 bg-transparent"
          />
          <button
            onClick={() => setPinned(!pinned)}
            className={`p-2 rounded-lg transition cursor-pointer ${pinned ? 'text-amber-500 bg-amber-50' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
            title={pinned ? 'Odepnout' : 'Připnout'}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 2a1 1 0 00-.707.293l-3.586 3.586-2.414-.828a1 1 0 00-1 .242l-2 2a1 1 0 00.121 1.535L9.586 11l-5.293 5.293a1 1 0 101.414 1.414L11 12.414l2.172 2.172a1 1 0 001.535.12l2-2a1 1 0 00.242-1l-.828-2.413 3.586-3.586A1 1 0 0020 4.586l-1.586-1.586-.707-.707A1 1 0 0016 2z" />
            </svg>
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Začněte psát..."
          rows={16}
          className="w-full text-gray-700 dark:text-gray-300 border-none outline-none resize-none placeholder-gray-300 dark:placeholder-gray-600 leading-relaxed bg-transparent"
        />

        {existing && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex gap-4">
            <span>Vytvořil/a: {existing.createdBy}</span>
            <span>Naposledy upravil/a: {existing.lastEditedBy}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {!isNew && (
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm text-red-500 hover:text-red-600 cursor-pointer"
          >
            Smazat poznámku
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition cursor-pointer"
          >
            Uložit
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Smazat poznámku"
        message={`Opravdu chcete smazat poznámku "${title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Use key to remount when ID changes, avoiding stale state
  return <NoteForm key={id} noteId={id ?? 'new'} />;
}
