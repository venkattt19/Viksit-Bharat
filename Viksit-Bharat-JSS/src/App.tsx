import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { OfficerSignup } from './pages/OfficerSignup';
import { Dashboard } from './pages/Dashboard';
import { Workers } from './pages/Workers';
import { Projects } from './pages/Projects';
import { Attendance } from './pages/Attendance';
import { WorkProgress } from './pages/WorkProgress';
import { Approvals } from './pages/Approvals';
import { Wages } from './pages/Wages';
import { FraudAlerts } from './pages/FraudAlerts';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/officer-signup" element={<OfficerSignup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Workers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/work-progress"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkProgress />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <Approvals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/wages"
            element={
              <ProtectedRoute>
                <Layout>
                  <Wages />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fraud-alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <FraudAlerts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
