import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/tickets" className="brand">QuickDesk</Link>
      <div className="nav-right">
        {user?.role === 'customer' && <Link to="/tickets/new">New Ticket</Link>}
        <span className="user-chip">{user?.name} · {user?.role}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}