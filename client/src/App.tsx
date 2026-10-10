import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TicketListPage from './pages/TicketListPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything below requires login and gets the navbar */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Route>
      </Route>

      {/* Customer-only branch. Declared separately so the role guard applies. */}
      <Route element={<ProtectedRoute roles={['customer']} />}>
        <Route element={<Layout />}>
          <Route path="/tickets/new" element={<CreateTicketPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  );
}