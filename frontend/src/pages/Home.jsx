import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="hero">
      <h1>Intelligent AI-Powered Job Matching</h1>
      <p>
        Accelerate your career search. Upload resumes for instant smart extraction, 
        take AI-graded skill assessments, and get matched to jobs based on your actual coding skills.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Link to="/register" className="btn btn-primary">Get Started</Link>
        <Link to="/login" className="btn btn-secondary">Sign In</Link>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '2rem', 
        width: '100%', 
        maxWidth: '1000px', 
        marginTop: '5rem' 
      }}>
        <div className="card">
          <h3>Resume Extraction</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Upload your resume PDF to instantly extract keys, skills, education, and career experience level.
          </p>
        </div>
        <div className="card">
          <h3>AI Assessments</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Take technical skills challenges in React, Node, Python, and JavaScript to prove your proficiency.
          </p>
        </div>
        <div className="card">
          <h3>Smart Matching</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Our matching engine evaluates requirements, experience, and assessment performance to calculate fit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
