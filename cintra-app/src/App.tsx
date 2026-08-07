import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LessonPlayer from './pages/LessonPlayer';
import AdminDashboard from './pages/AdminDashboard';
import Materials from './pages/Materials';
import LectureView from './pages/LectureView';
import UpdatePassword from './pages/UpdatePassword';

function Gate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-textMuted text-sm">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireInstructor({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (profile && profile.role === 'student') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Routed() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route
        path="/"
        element={
          <Gate>
            <Dashboard />
          </Gate>
        }
      />
      <Route
        path="/lesson/:lessonId"
        element={
          <Gate>
            <LessonPlayer />
          </Gate>
        }
      />
      <Route
        path="/admin"
        element={
          <Gate>
            <RequireInstructor>
              <AdminDashboard />
            </RequireInstructor>
          </Gate>
        }
      />
      <Route
        path="/lecture/:lessonId"
        element={
          <Gate>
            <LectureView />
          </Gate>
        }
      />
      <Route
        path="/materials"
        element={
          <Gate>
            <RequireInstructor>
              <Materials />
            </RequireInstructor>
          </Gate>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routed />
    </AuthProvider>
  );
}
