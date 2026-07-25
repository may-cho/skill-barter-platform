import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, ProtectedRoute } from './components/Layout';
import LoginPage, { RegisterPage } from './pages/AuthPages';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProposalsPage, { NewProposalPage } from './pages/ProposalsPage';
import CalendarPage from './pages/CalendarPage';
import ReviewsPage from './pages/ReviewsPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/AdminLayout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />


          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/discover" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposals/new" element={<NewProposalPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="proposals" element={<AdminDashboard />} />
              <Route path="skills" element={<AdminDashboard />} />
              <Route path="notifications" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/discover" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}