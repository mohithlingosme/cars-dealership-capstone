import { useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Landing from './components/Landing/Landing.jsx';
import Dealers from './components/Dealers/Dealers.jsx';
import DealerDetail from './components/DealerDetail/DealerDetail.jsx';
import Login from './components/Login/Login.jsx';
import Register from './components/Register/Register.jsx';
import ReviewForm from './components/ReviewForm/ReviewForm.jsx';
import Footer from './components/Footer/Footer.jsx';
import { apiGet, getLoggedInUser } from './api.js';

export default function App() {
  const [userName, setUserName] = useState('');

  const refreshUser = useCallback(async () => {
    setUserName(await getLoggedInUser());
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="app-shell">
      <Navbar userName={userName} onLogout={refreshUser} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dealers" element={<Dealers userName={userName} />} />
          <Route path="/dealers/:state" element={<Dealers userName={userName} />} />
          <Route path="/dealer/:dealerId" element={<DealerDetail userName={userName} />} />
          <Route path="/login" element={<Login onLogin={refreshUser} />} />
          <Route path="/register" element={<Register onRegister={refreshUser} />} />
          <Route path="/review/:dealerId" element={<ReviewForm userName={userName} />} />
          <Route
            path="*"
            element={
              <section className="container section">
                <h1>Page not found</h1>
                <p>The page you requested does not exist.</p>
              </section>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
