import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UniversitiesPage } from './pages/UniversitiesPage';
import { ModulesPage } from './pages/ModulesPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserUploadsPage } from './pages/UserUploadsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemConfigPage } from './pages/SystemConfigPage';
import { UploadBatchesPage } from './pages/UploadBatchesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AdminsPage } from './pages/AdminsPage';

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, admin, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!admin) return <div className="page">Access denied.</div>;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <AdminGate>
                <Layout />
              </AdminGate>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="universities" element={<UniversitiesPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="user-uploads" element={<UserUploadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="admins" element={<AdminsPage />} />
            <Route path="system-config" element={<SystemConfigPage />} />
            <Route path="upload-batches" element={<UploadBatchesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
