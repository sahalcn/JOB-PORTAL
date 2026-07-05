import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Failed to login');
    }
  };

  return (
    <div className="form-container">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◈</div>
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Sign in to your JobSphere account</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          id="login-submit"
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>

      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Create one free
        </Link>
      </p>
    </div>
  );
};

export default Login;
