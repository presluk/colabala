import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useData } from '../../context/DataContext';

export default function AppShell() {
  const { isSaving } = useData();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 pb-20 md:pb-0">
        <main className="p-4 md:p-8 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Saving indicator - floating on mobile, sidebar on desktop handled in Sidebar */}
      {isSaving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-4 md:left-auto md:right-4 md:translate-x-0 z-50">
          <div className="bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
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
            Ukládání...
          </div>
        </div>
      )}
    </div>
  );
}
