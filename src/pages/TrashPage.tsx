import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const entityLabels: Record<string, string> = {
  shoppingList: 'Nákupní seznam',
  task: 'Úkol',
  note: 'Poznámka',
};

const entityIcons: Record<string, string> = {
  shoppingList: '🛒',
  task: '✓',
  note: '📝',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'právě teď';
  if (minutes < 60) return `před ${minutes} min`;
  if (hours < 24) return `před ${hours} hod`;
  if (days < 7) return `před ${days} dny`;
  return new Date(dateStr).toLocaleDateString('cs-CZ');
}

export default function TrashPage() {
  const { data, restoreFromTrash, permanentDelete, emptyTrash } = useData();
  const { currentUser } = useUser();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userName = currentUser?.name ?? 'Anonym';

  const sorted = [...data.trash].sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );

  const handleRestore = async (trashId: string) => {
    await restoreFromTrash(trashId, userName);
  };

  const handlePermanentDelete = async () => {
    if (deletingId) {
      await permanentDelete(deletingId);
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setConfirmEmpty(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Koš</h1>
        {sorted.length > 0 && (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer"
          >
            Vysypat koš
          </button>
        )}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🗑️</div>
          <p className="text-gray-500 dark:text-gray-400">Koš je prázdný</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((item) => {
          const itemData = item.data as { title: string };
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4"
            >
              <span className="text-xl">{entityIcons[item.entityType] ?? '📄'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{itemData.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {entityLabels[item.entityType]} · smazal/a {item.deletedBy} · {relativeTime(item.deletedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(item.id)}
                  className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition cursor-pointer"
                >
                  Obnovit
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  Smazat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmEmpty}
        title="Vysypat koš"
        message="Opravdu chcete trvale smazat všechny položky v koši? Tuto akci nelze vrátit."
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmEmpty(false)}
      />

      <ConfirmDialog
        open={deletingId !== null}
        title="Trvale smazat"
        message="Opravdu chcete trvale smazat tuto položku? Tuto akci nelze vrátit."
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
