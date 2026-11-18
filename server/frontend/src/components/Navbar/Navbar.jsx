import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api.js';

export default function Navbar({ userName, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await apiGet('/logout');
    } finally {
      onLogout();
      setOpen(false);
      navigate('/');
    }
  }

  return (
    <header className="site-header">
      <nav className="container navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">CD</span>
          <span>
            CarDeal <small>Dealerships</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          ☰
        </button>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li><NavLink to="/dealers" onClick={() => setOpen(false)}>Dealers</NavLink></li>
          <li><a href="/About.html">About Us</a></li>
          <li><a href="/Contact.html">Contact Us</a></li>
          {userName ? (
            <>
              <li className="nav-user">Signed in: <strong>{userName}</strong></li>
              <li>
                <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" onClick={() => setOpen(false)}>Login</NavLink></li>
              <li>
                <Link to="/register" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
