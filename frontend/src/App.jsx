import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SessionsPage } from './pages/SessionsPage.jsx';
import { SecurityPage } from './pages/SecurityPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';
import { AssistantPage } from './pages/AssistantPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:peer" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
