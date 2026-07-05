import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SeekerDashboard from './pages/SeekerDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { FaBell, FaSignOutAlt, FaUser } from 'react-icons/fa';

// Custom Navbar with Live Notifications
const NavigationBar = () => {
  const { user, token, logout, API_URL } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Small delay so backend finishes processing registration before first poll
      const initialDelay = setTimeout(() => {
        fetchNotifications();
      }, 1500);
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => {
        clearTimeout(initialDelay);
        clearInterval(interval);
      };
    } else {
      setNotifications([]);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return; // Server error — silently skip, do not crash UI
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      // Network error — silently ignore, will retry on next interval
    }
  };


  const markNotificationsRead = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && notifications.some(n => !n.isRead)) {
      try {
        await fetch(`${API_URL}/notifications/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        ◈ Job<span>Sphere</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={markNotificationsRead} title="Notifications">
                <FaBell size={15} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="badge badge-info">{unreadCount} new</span>}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        All caught up! No notifications.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif._id} className={`notif-item ${!notif.isRead ? 'unread' : ''}`}>
                          <p style={{ fontSize: '0.82rem', color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {notif.message}
                          </p>
                          <div className="notif-time">{new Date(notif.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User pill */}
            <div className="nav-user-tag">
              <FaUser size={11} style={{ color: 'var(--primary)' }} />
              <span>{user.name}</span>
              <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>{user.role}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
              <FaSignOutAlt size={13} /> Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};


// Route Redirector based on user role
const ProtectedDashboard = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Verifying identity...</div>;
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'Job Seeker':
      return <SeekerDashboard />;
    case 'Employer':
      return <EmployerDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <NavigationBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
