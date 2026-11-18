import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../../api.js';

const EMPTY_FORM = {
  userName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

function validate(form) {
  const errors = {};
  if (form.userName.trim().length < 3) {
    errors.userName = 'Username must be at least 3 characters.';
  }
  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

export default function Register({ onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await apiPost('/register', form);
      await onRegister();
      navigate('/dealers');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container section auth-section">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <p className="muted">Register to submit dealership reviews.</p>
        {serverError && <p className="alert alert-error">{serverError}</p>}
        <form onSubmit={handleSubmit} className="form" noValidate>
          <label>
            Username
            <input type="text" name="userName" value={form.userName} onChange={update('userName')} required />
            {errors.userName && <span className="field-error">{errors.userName}</span>}
          </label>
          <label>
            First Name
            <input type="text" name="firstName" value={form.firstName} onChange={update('firstName')} required />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </label>
          <label>
            Last Name
            <input type="text" name="lastName" value={form.lastName} onChange={update('lastName')} required />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={update('email')} required />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update('password')} required />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
