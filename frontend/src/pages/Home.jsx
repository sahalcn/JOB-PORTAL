import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="hero">
      <div className="hero-badge">✦ AI-Powered Recruiting Platform</div>

      <h1>Find Your Dream Job<br />with Intelligent Matching</h1>

      <p>
        Upload your resume for instant AI extraction, prove your skills with real assessments,
        and get matched to opportunities based on your actual technical ability.
      </p>

      <div className="hero-cta">
        <Link to="/register" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
          Get Started Free →
        </Link>
        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
          Sign In
        </Link>
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <strong>10K+</strong>
          <span>Active Jobs</span>
        </div>
        <div className="hero-stat">
          <strong>98%</strong>
          <span>Match Accuracy</span>
        </div>
        <div className="hero-stat">
          <strong>4</strong>
          <span>Skill Assessments</span>
        </div>
        <div className="hero-stat">
          <strong>3</strong>
          <span>User Roles</span>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '1000px',
        marginTop: '4rem',
      }}>
        {[
          {
            icon: '📄',
            title: 'Resume AI Parser',
            desc: 'Paste your resume and our engine instantly extracts skills, education, and experience level.',
            color: 'var(--primary)',
          },
          {
            icon: '🏆',
            title: 'Skill Assessments',
            desc: 'Take graded tests in React, Node.js, Python, and JavaScript to earn verified skill badges.',
            color: 'var(--accent)',
          },
          {
            icon: '⚡',
            title: 'Smart Job Matching',
            desc: 'Our AI ranks jobs by your real fit — comparing skills, experience, and test scores.',
            color: 'var(--tertiary)',
          },
          {
            icon: '📅',
            title: 'Interview Scheduling',
            desc: 'Employers book interviews with one click and candidates see the details instantly.',
            color: 'var(--success)',
          },
        ].map((feature) => (
          <div className="card" key={feature.title} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.75rem' }}>{feature.icon}</div>
            <h3 style={{ color: feature.color, fontSize: '1rem' }}>{feature.title}</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
