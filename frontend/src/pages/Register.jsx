import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Job Seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register(name, email, password, role);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  const roleOptions = [
    { value: 'Job Seeker', label: '🔍 Job Seeker', desc: 'Find and apply for jobs' },
    { value: 'Employer', label: '💼 Employer', desc: 'Post jobs and hire candidates' },
    { value: 'Admin', label: '⚙ Admin', desc: 'Manage the platform' },
  ];

  return (
    <div className="form-container" style={{ maxWidth: '500px' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◈</div>
        <h2>Create Account</h2>
        <p className="form-subtitle">Join JobSphere and accelerate your career</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            id="register-name"
            type="text"
            className="form-control"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            id="register-email"
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
            id="register-password"
            type="password"
            className="form-control"
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Role Selector Cards */}
        <div className="form-group">
          <label>I am a...</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            {roleOptions.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${role === opt.value ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  background: role === opt.value ? 'var(--primary-glow)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: role === opt.value ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          id="register-submit"
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account →'}
        </button>
      </form>

      <div className="divider" />
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
