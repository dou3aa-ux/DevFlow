import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
//import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
                  }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route
          path="/projects/:id"
          element={
          <ProtectedRoute>
            <ProjectBoard />
          </ProtectedRoute>
          }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;