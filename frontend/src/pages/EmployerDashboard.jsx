import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const EmployerDashboard = () => {
  const { token, API_URL } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('my-jobs'); // my-jobs, post-job
  
  // Job Post form fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level');

  // Jobs state
  const [jobs, setJobs] = useState([]);
  
  // Applicants lists
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  
  // Interview scheduling modal
  const [schedulingApp, setSchedulingApp] = useState(null);
  const [dateTime, setDateTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  // Status/Messages
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchEmployerJobs();
  }, [token]);

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
  };

  const fetchEmployerJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs/employer/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title, company, description, requirements, salary, location, jobType, experienceLevel
        })
      });
      const data = await res.json();
      if (data.success) {
        showStatus('Job listing published successfully!');
        setTitle('');
        setCompany('');
        setDescription('');
        setRequirements('');
        setSalary('');
        setLocation('');
        fetchEmployerJobs();
        setActiveTab('my-jobs');
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Post job failed', 'danger');
    }
  };

  const handleViewApplicants = async (jobId) => {
    setSelectedJobId(jobId);
    try {
      const res = await fetch(`${API_URL}/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setApplicants(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/applications/${schedulingApp._id}/interview`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dateTime, mode, link, notes })
      });
      const data = await res.json();
      if (data.success) {
        showStatus('Interview scheduled & notification dispatched!');
        setDateTime('');
        setLink('');
        setNotes('');
        setSchedulingApp(null);
        // Refresh applicants
        handleViewApplicants(selectedJobId);
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Failed to schedule interview', 'danger');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <div className="sidebar">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h3>Employer Console</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Recruiter Account</p>
        </div>
        <div className="sidebar-menu">
          <button className={`sidebar-btn ${activeTab === 'my-jobs' ? 'active' : ''}`} onClick={() => { setActiveTab('my-jobs'); setSelectedJobId(null); }}>
            📁 My Job Postings
          </button>
          <button className={`sidebar-btn ${activeTab === 'post-job' ? 'active' : ''}`} onClick={() => { setActiveTab('post-job'); setSelectedJobId(null); }}>
            📝 Publish New Job
          </button>
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="dashboard-content">
        {statusMessage.text && (
          <div className={`badge badge-${statusMessage.type === 'danger' ? 'danger' : 'success'}`} style={{ width: '100%', padding: '1rem', marginBottom: '1rem', textAlign: 'center', fontSize: '1rem' }}>
            {statusMessage.text}
          </div>
        )}

        {/* View published job posts */}
        {activeTab === 'my-jobs' && !selectedJobId && (
          <div>
            <h2>My Published Jobs</h2>
            {jobs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No job listings created yet.</p>
            ) : (
              <div className="card-grid">
                {jobs.map((job) => (
                  <div className="card" key={job._id}>
                    <div>
                      <h4>{job.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{job.company} • {job.location}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Salary: {job.salary}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Level: {job.experienceLevel} • {job.jobType}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleViewApplicants(job._id)}>
                      Review Applicants
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create job posting tab */}
        {activeTab === 'post-job' && (
          <div style={{ maxWidth: '700px' }}>
            <h2>Publish a New Job Listing</h2>
            <form onSubmit={handlePostJob} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Company/Agency Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Salary Range</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. $80,000 - $110,000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Job Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Remote, New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Job Type</label>
                <select className="form-control" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div className="form-group">
                <label>Required Experience Level</label>
                <select className="form-control" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead / Director">Lead / Director</option>
                </select>
              </div>
              <div className="form-group">
                <label>Skills Required (comma separated list)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. react, node, javascript"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Detailed Job Description</label>
                <textarea
                  rows="6"
                  className="form-control"
                  placeholder="Explain responsibilities, benefits, and requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Publish Job Ads
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View applicants panel */}
        {selectedJobId && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Reviewing Candidates</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedJobId(null)}>← Back to List</button>
            </div>
            {applicants.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No submissions for this position yet.</p>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Email</th>
                    <th>Experience</th>
                    <th>Extracted Skills</th>
                    <th>AI Match Score</th>
                    <th>Assessment Scores</th>
                    <th>Interview Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((app) => (
                    <tr key={app._id}>
                      <td><strong>{app.seeker?.name}</strong></td>
                      <td>{app.seeker?.email}</td>
                      <td>{app.seeker?.profile?.experience} Years</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {app.seeker?.profile?.skills?.map((s, idx) => (
                            <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{s}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${app.matchScore >= 70 ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                          {app.matchScore}% Match
                        </span>
                      </td>
                      <td>
                        {app.seeker?.profile?.assessmentScores?.length > 0 ? (
                          app.seeker.profile.assessmentScores.map((score, i) => (
                            <div key={i} style={{ fontSize: '0.75rem' }}>
                              {score.skill}: <strong style={{ color: score.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>{score.score}%</strong>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None Taken</span>
                        )}
                      </td>
                      <td>
                        {app.interviewDetails?.dateTime ? (
                          <span className="badge badge-accent">Scheduled</span>
                        ) : (
                          <span className="badge badge-secondary">Pending</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setSchedulingApp(app)}>
                          Schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Scheduling modal */}
        {schedulingApp && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-secondary)' }}>
              <h2>Schedule Call: {schedulingApp.seeker?.name}</h2>
              <form onSubmit={handleScheduleInterview} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Meeting Mode</label>
                  <select className="form-control" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="Online">Online Video Call</option>
                    <option value="In-Person">In-Person Meeting</option>
                    <option value="Phone">Phone Call</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Meeting / location Link</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://zoom.us/j/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Notes / Instructions</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Preparation advice or panel details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Confirm Interview</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSchedulingApp(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
