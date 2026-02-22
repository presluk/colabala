import type { ChangelogEntry } from '../../types';

interface ChangelogTimelineProps {
  entries: ChangelogEntry[];
  limit?: number;
  filterByUserId?: string | null;
  isAdmin?: boolean;
  showAll?: boolean;
}

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

const actionColors: Record<string, string> = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  check: 'bg-green-400',
  uncheck: 'bg-gray-400',
};

const entityIcons: Record<string, string> = {
  shoppingList: '🛒',
  task: '✓',
  note: '📝',
  tag: '🏷️',
};

export default function ChangelogTimeline({
  entries,
  limit,
  filterByUserId,
  isAdmin,
  showAll,
}: ChangelogTimelineProps) {
  let filtered = entries;

  // Filter unless admin+showAll
  if (!(isAdmin && showAll) && filterByUserId) {
    filtered = entries.filter((entry) => {
      // Backward compat: entries without relevantUserIds are shown to everyone
      if (!entry.relevantUserIds || entry.relevantUserIds.length === 0) return true;
      return entry.relevantUserIds.includes(filterByUserId);
    });
  }

  const sorted = [...filtered]
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 py-4">Zatím žádná aktivita</p>;
  }

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => (
        <div key={entry.id} className="flex gap-3 py-3">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${actionColors[entry.action] ?? 'bg-gray-400'}`} />
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              <span className="mr-1">{entityIcons[entry.entityType] ?? ''}</span>
              <span className="font-medium">{entry.performedBy}</span>{' '}
              {entry.summary}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{relativeTime(entry.performedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
