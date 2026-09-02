import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeveloperDashboard from './pages/DeveloperDashboard'; // ✅ ADD THIS
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';
import CiCdPage from './pages/CiCdPage';
import InfrastructurePage from './pages/InfrastructurePage';
import KanbanPage from './pages/KanbanPage';
import UserManagement from './pages/UserManagement';
import CreateProjectGroup from './pages/CreateProjectGroup';
import CreateTaskPage from './pages/CreateTaskPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/kanban"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'ADMINISTRATOR']}>
                <KanbanPage />
              </ProtectedRoute>
            }
          />
          <Route path="/cicd" element={<ProtectedRoute><CiCdPage /></ProtectedRoute>} />
          <Route path="/infrastructure" element={<ProtectedRoute><InfrastructurePage /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />

          {/* ✅ ADD THIS ROUTE */}
          <Route
            path="/developer"
            element={
              <ProtectedRoute allowedRoles={['DEVELOPER', 'ADMINISTRATOR']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <div className="min-h-screen bg-[#050508] text-white p-8">
                  Role Assignment — coming next
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <CreateProjectGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/tasks/new"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMINISTRATOR']}>
                <CreateTaskPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;