import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DashboardProvider } from './context/DashboardContext.tsx';
import MainLayout from './layouts/MainLayout.tsx';

// Lazy load route pages to segment production client bundle size
const Login = React.lazy(() => import('./pages/Login.tsx'));
const Register = React.lazy(() => import('./pages/Register.tsx'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.tsx'));
const Security = React.lazy(() => import('./pages/Security.tsx'));
const Cost = React.lazy(() => import('./pages/Cost.tsx'));
const Insights = React.lazy(() => import('./pages/Insights.tsx'));
const Terraform = React.lazy(() => import('./pages/Terraform.tsx'));
const History = React.lazy(() => import('./pages/History.tsx'));
const Settings = React.lazy(() => import('./pages/Settings.tsx'));
const Resources = React.lazy(() => import('./pages/Resources.tsx'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs.tsx'));

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#0f172a]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * Protected Route wrapper
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </DashboardProvider>
  );
};

function AppContent() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <React.Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/cost" element={<Cost />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/terraform" element={<Terraform />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </React.Suspense>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </React.Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
