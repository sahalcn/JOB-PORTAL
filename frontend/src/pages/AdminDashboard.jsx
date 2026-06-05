import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { token, API_URL } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [token]);

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is permanent.')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showStatus('User removed from system successfully!');
        fetchUsers();
        fetchStats();
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Failed to delete user', 'danger');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Admin Console...</div>;

  return (
    <div>
      <h2>System Administration</h2>
      
      {statusMessage.text && (
        <div className={`badge badge-${statusMessage.type === 'danger' ? 'badge-danger' : 'badge-success'}`} style={{ width: '100%', padding: '1rem', margin: '1rem 0', textAlign: 'center', fontSize: '1rem' }}>
          {statusMessage.text}
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', margin: '2rem 0' }}>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.totalUsers}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Accounts</p>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--accent)' }}>{stats.totalJobs}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Listings</p>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>{stats.totalApplications}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submissions</p>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--warning)' }}>{stats.totalSeekers}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Job Seekers</p>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--danger)' }}>{stats.totalEmployers}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Employers</p>
          </div>
        </div>
      )}

      <h3>Registered Accounts Moderation</h3>
      <table className="premium-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email Address</th>
            <th>Role</th>
            <th>Registration Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((userItem) => (
            <tr key={userItem._id}>
              <td><strong>{userItem.name}</strong></td>
              <td>{userItem.email}</td>
              <td>
                <span className={`badge ${
                  userItem.role === 'Admin' ? 'badge-danger' : 
                  userItem.role === 'Employer' ? 'badge-accent' : 'badge-info'
                }`}>
                  {userItem.role}
                </span>
              </td>
              <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  onClick={() => handleDeleteUser(userItem._id)}
                  disabled={userItem.role === 'Admin'}
                >
                  Delete Account
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
