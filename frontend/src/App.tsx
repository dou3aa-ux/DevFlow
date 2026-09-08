import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import Projects from './pages/Projects';
import KanbanPage from './pages/KanbanPage';
import CiCdPage from './pages/CiCdPage';
import InfrastructurePage from './pages/InfrastructurePage';
import UserManagement from './pages/UserManagement';
import CreateProjectGroup from './pages/CreateProjectGroup';
import CreateTaskPage from './pages/CreateTaskPage';
import QABugsPage from './pages/QABugsPage';
import MobileBuildsPage from './pages/MobileBuildsPage';
import StakeholderReviewPage from './pages/StakeholderReviewPage';
import ProjectAnalyticsPage from './pages/ProjectAnalyticsPage';
import RoleAssignmentPage from './pages/RoleAssignmentPage';
import SystemLogsPage from './pages/SystemLogsPage';
import DocumentationPage from './pages/DocumentationPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<Login />} />

          {/* Core Dashboard & Project Management */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'ADMINISTRATOR']}>
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
            path="/kanban"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'DEVELOPER', 'QA_TESTER', 'ADMINISTRATOR']}>
                <KanbanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <KanbanPage />
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

          {/* Developer & CI/CD Pipelines */}
          <Route
            path="/developer"
            element={
              <ProtectedRoute allowedRoles={['DEVELOPER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cicd"
            element={
              <ProtectedRoute allowedRoles={['DEVELOPER', 'PROJECT_MANAGER', 'QA_TESTER', 'ADMINISTRATOR']}>
                <CiCdPage />
              </ProtectedRoute>
            }
          />

          {/* QA & Mobile Distribution */}
          <Route
            path="/qa"
            element={
              <ProtectedRoute allowedRoles={['QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
                <QABugsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mobile-builds"
            element={
              <ProtectedRoute allowedRoles={['QA_TESTER', 'DEVELOPER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
                <MobileBuildsPage />
              </ProtectedRoute>
            }
          />

          {/* Stakeholder Review & Analytics */}
          <Route
            path="/stakeholder-review"
            element={
              <ProtectedRoute allowedRoles={['STAKEHOLDER', 'PROJECT_MANAGER', 'ADMINISTRATOR', 'DEVELOPER']}>
                <StakeholderReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMINISTRATOR', 'DEVELOPER', 'STAKEHOLDER']}>
                <ProjectAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Infrastructure & Knowledge */}
          <Route
            path="/infrastructure"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'DEVELOPER', 'PROJECT_MANAGER']}>
                <InfrastructurePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/docs"
            element={
              <ProtectedRoute>
                <DocumentationPage />
              </ProtectedRoute>
            }
          />

          {/* Administration */}
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
                <RoleAssignmentPage />
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
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                <SystemLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;