import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider, useUser } from './context/UserContext';
import { DataProvider, useData } from './context/DataContext';
import LoginScreen from './components/LoginScreen';
import UserPicker from './components/UserPicker';
import LoadingSpinner from './components/shared/LoadingSpinner';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import ShoppingListsPage from './pages/ShoppingListsPage';
import ShoppingListPage from './pages/ShoppingListPage';
import TasksPage from './pages/TasksPage';
import NotesPage from './pages/NotesPage';
import NoteDetailPage from './pages/NoteDetailPage';
import TrashPage from './pages/TrashPage';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginScreen />;

  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  );
}

function AppInner() {
  const { currentUser } = useUser();
  const { isLoading } = useData();

  if (isLoading) return <LoadingSpinner />;
  if (!currentUser) return <UserPicker />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="shopping" element={<ShoppingListsPage />} />
        <Route path="shopping/:id" element={<ShoppingListPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/:id" element={<NoteDetailPage />} />
        <Route path="trash" element={<TrashPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
