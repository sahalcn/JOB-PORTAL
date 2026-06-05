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
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll notifications every 10s
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
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
        🚀 JobSphere <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 500 }}>AI Portal</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            
            {/* Notification Pane */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={markNotificationsRead}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}
              >
                <FaBell />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute', right: 0, top: '2.5rem', width: '320px', 
                  backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                  borderRadius: '12px', padding: '1rem', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  <h4 style={{ marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    Notifications
                  </h4>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No notifications</p>
                  ) : (
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {notifications.map((notif) => (
                        <div key={notif._id} style={{ 
                          fontSize: '0.8rem', padding: '0.5rem 0', 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', 
                          color: notif.isRead ? 'var(--text-secondary)' : '#fff',
                          fontWeight: notif.isRead ? 'normal' : '600'
                        }}>
                          {notif.message}
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile tag info */}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaUser style={{ color: 'var(--primary)' }} /> {user.name} ({user.role})
            </span>

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
              <FaSignOutAlt /> Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Register</Link>
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
