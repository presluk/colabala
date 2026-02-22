import { useState, type FormEvent } from 'react';

interface AddItemFormProps {
  onAdd: (text: string) => void;
}

export default function AddItemForm({ onAdd }: AddItemFormProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nová položka..."
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Přidat
      </button>
    </form>
  );
}
