import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { getErrorMessage } from './api/client';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  if (loading) return <p>Loading...</p>;

  if (user) {
    return (
      <div style={{ padding: 24 }}>
        <p>Logged in as {user.name} ({user.role})</p>
        <button onClick={logout}>Log out</button>
      </div>
    );
  }

  const handleLogin = async () => {
    try {
      setError('');
      await login(email, password);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}