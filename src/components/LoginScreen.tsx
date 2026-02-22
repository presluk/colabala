import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

function detectOwner(): string {
  const { hostname } = window.location;
  if (hostname.endsWith('.github.io')) {
    return hostname.replace('.github.io', '');
  }
  return '';
}

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const owner = detectOwner();
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState(owner ? `${owner}/colabala-data` : '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(token, repo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🐨 Colabala
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Sdílené poznámky a úkoly</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Přístupový token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              placeholder="github_pat_..."
            />
          </div>

          <div>
            <label
              htmlFor="repo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Datový repozitář (vlastník/repo)
            </label>
            <input
              id="repo"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              placeholder="jan/colabala-data"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Privátní repozitář pro ukládání dat
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Přihlašování...
              </>
            ) : (
              'Přihlásit se'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
