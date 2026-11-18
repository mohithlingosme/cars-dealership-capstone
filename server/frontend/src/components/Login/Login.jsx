import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../../api.js';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiPost('/login', form);
      await onLogin();
      navigate('/dealers');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section auth-section">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to review dealerships and manage your account.</p>
        {error && <p className="alert alert-error">{error}</p>}
        <form onSubmit={handleSubmit} className="form">
          <label>
            Username
            <input
              type="text"
              name="userName"
              autoComplete="username"
              value={form.userName}
              onChange={update('userName')}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="muted">
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </section>
  );
}
