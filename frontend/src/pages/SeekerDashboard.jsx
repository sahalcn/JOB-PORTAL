import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const SeekerDashboard = () => {
  const { user, token, updateProfile, API_URL } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('jobs'); // jobs, profile, applications, assessments
  
  // Profile inputs
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [experience, setExperience] = useState(user?.profile?.experience || 0);
  const [education, setEducation] = useState(user?.profile?.education || '');
  const [skillsInput, setSkillsInput] = useState(user?.profile?.skills?.join(', ') || '');
  
  // Resume Parsing input
  const [resumeText, setResumeText] = useState('');
  const [parseStatus, setParseStatus] = useState('');
  
  // Job lists & Search
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Applications list
  const [myApplications, setMyApplications] = useState([]);

  // Assessment state
  const [assessmentSkill, setAssessmentSkill] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Status/Messages
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchJobs();
    fetchRecommendedJobs();
    fetchMyApplications();
  }, [token]);

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs?keyword=${searchKeyword}&location=${searchLocation}`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/applications/matching`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRecommendedJobs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/applications/seeker/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMyApplications(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    const res = await updateProfile({
      name: user.name,
      profile: { bio, experience: parseInt(experience), education, skills }
    });
    if (res.success) {
      showStatus('Profile updated successfully!');
      fetchRecommendedJobs();
    } else {
      showStatus(res.message, 'danger');
    }
  };

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      showStatus('Please paste your resume text to parse', 'danger');
      return;
    }
    setParseStatus('Parsing with AI Engine...');
    try {
      const res = await fetch(`${API_URL}/applications/parse-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText })
      });
      
      const data = await res.json();

      if (data.success) {
        setBio(data.data.profile.bio);
        setExperience(data.data.profile.experience);
        setEducation(data.data.profile.education);
        setSkillsInput(data.data.profile.skills.join(', '));
        
        // Let the AuthContext know the user profile changed
        await updateProfile({ profile: data.data.profile });

        setParseStatus('Successfully parsed & profile updated!');
        showStatus('Resume details extracted!');
        fetchRecommendedJobs();
      } else {
        setParseStatus(`Parsing failed: ${data.message}`);
      }
    } catch (err) {
      setParseStatus('Network error while parsing resume.');
    }
  };

  const handleApply = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/applications/apply/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText: `Skills: ${user.profile.skills.join(', ')}. Exp: ${user.profile.experience} years.` })
      });
      const data = await res.json();
      if (data.success) {
        showStatus(`Applied successfully! AI Match Score: ${data.matchScore}%`);
        fetchMyApplications();
        setSelectedJob(null);
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Application error', 'danger');
    }
  };

  const startAssessment = async (skill) => {
    setAssessmentSkill(skill);
    setAnswers({});
    setAssessmentResult(null);
    try {
      const res = await fetch(`${API_URL}/applications/assessment/${skill}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Error fetching assessment questions', 'danger');
    }
  };

  const submitAssessmentAnswers = async () => {
    try {
      const res = await fetch(`${API_URL}/applications/assessment/${assessmentSkill}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (data.success) {
        setAssessmentResult(data.score);
        showStatus(`Assessment graded! Score: ${data.score}%`);
        // Refresh skills
        fetchRecommendedJobs();
      } else {
        showStatus(data.message, 'danger');
      }
    } catch (err) {
      showStatus('Submission error', 'danger');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <div className="sidebar">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h3>{user?.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Job Seeker</p>
        </div>
        <div className="sidebar-menu">
          <button className={`sidebar-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
            🔍 Search Jobs
          </button>
          <button className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            👤 My Profile & Parser
          </button>
          <button className={`sidebar-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
            📄 Applications
          </button>
          <button className={`sidebar-btn ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')}>
            🏆 AI Skill Challenge
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

        {/* Search jobs tab */}
        {activeTab === 'jobs' && (
          <div>
            <h2>Find Your Next Opportunity</h2>
            <div style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
              <input
                type="text"
                placeholder="Job title, keywords, or skills..."
                className="form-control"
                style={{ flex: 2 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <input
                type="text"
                placeholder="Location..."
                className="form-control"
                style={{ flex: 1 }}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
              <button className="btn btn-primary" onClick={fetchJobs}>Search</button>
            </div>

            {/* Smart Matches */}
            {recommendedJobs.length > 0 && (
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🤖 Smart AI Recommendations
                </h3>
                <div className="card-grid">
                  {recommendedJobs.slice(0, 3).map(({ job, matchScore }) => (
                    <div className="card" key={job._id}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4>{job.title}</h4>
                          <span className={`badge ${matchScore >= 70 ? 'badge-success' : 'badge-info'}`}>
                            {matchScore}% Match
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>{job.company} • {job.location}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Required: {job.requirements.join(', ')}</p>
                      </div>
                      <button className="btn btn-secondary" onClick={() => setSelectedJob(job)}>View & Apply</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3>All Active Job Listings</h3>
            {jobs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No jobs match your search criteria.</p>
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
                    <button className="btn btn-secondary" onClick={() => setSelectedJob(job)}>View Job Detail</button>
                  </div>
                ))}
              </div>
            )}

            {selectedJob && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
              }}>
                <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90%', overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                  <h2>{selectedJob.title}</h2>
                  <h4>{selectedJob.company}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>📍 {selectedJob.location} | 💼 {selectedJob.jobType} | 👔 {selectedJob.experienceLevel}</p>
                  <p style={{ margin: '1rem 0' }}>{selectedJob.description}</p>
                  <div>
                    <strong>Required Skills:</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {selectedJob.requirements.map((req, i) => (
                        <span key={i} className="badge badge-info">{req}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button className="btn btn-primary" onClick={() => handleApply(selectedJob._id)}>Apply Instantly</button>
                    <button className="btn btn-secondary" onClick={() => setSelectedJob(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile and parsing tab */}
        {activeTab === 'profile' && (
          <div>
            <h2>My Profile & Skills Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
              <div>
                <h3>Edit Profile Data</h3>
                <form onSubmit={handleUpdateProfile} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Professional Bio</label>
                    <textarea
                      rows="4"
                      className="form-control"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Years of Coding Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Highest Education</label>
                    <input
                      type="text"
                      className="form-control"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Skills (Comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. react, node, javascript, python"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                    Save Profile
                  </button>
                </form>
              </div>

              <div>
                <h3>AI Resume Parser</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Paste the text content of your resume below. Our local parser will automatically search for keywords and extract experiences, degree qualifications, and technical capabilities to update your profile card!
                </p>
                <div className="form-group">
                  <label>Resume Content / Raw Text</label>
                  <textarea
                    rows="10"
                    className="form-control"
                    placeholder="Paste resume details... (Include keywords like 'React', 'Node', 'Python' or experience mentions like '3 years of experience')"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
                <button className="btn btn-accent" onClick={handleParseResume} style={{ width: '100%' }}>
                  Parse Resume Content
                </button>
                {parseStatus && <p style={{ marginTop: '1rem', fontWeight: '600', color: 'var(--accent)' }}>{parseStatus}</p>}

                {user?.profile?.skills?.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h4>Current Skills Extracted</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {user.profile.skills.map((skill, index) => (
                        <span key={index} className="badge badge-success">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications status tab */}
        {activeTab === 'applications' && (
          <div>
            <h2>My Job Applications</h2>
            {myApplications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>You have not applied for any jobs yet.</p>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Application Date</th>
                    <th>Match Score</th>
                    <th>Status</th>
                    <th>Interview Details</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map((app) => (
                    <tr key={app._id}>
                      <td><strong>{app.job?.title}</strong></td>
                      <td>{app.job?.company}</td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${app.matchScore >= 70 ? 'badge-success' : 'badge-info'}`}>
                          {app.matchScore}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          app.status === 'Interview Scheduled' ? 'badge-accent' : 
                          app.status === 'Rejected' ? 'badge-danger' : 
                          app.status === 'Accepted' ? 'badge-success' : 'badge-info'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.interviewDetails?.dateTime ? (
                          <div style={{ fontSize: '0.85rem' }}>
                            <p>📅 {new Date(app.interviewDetails.dateTime).toLocaleString()}</p>
                            <p>🔗 {app.interviewDetails.link ? <a href={app.interviewDetails.link} target="_blank" style={{ textDecoration: 'underline', color: 'var(--accent)' }}>Join Call</a> : app.interviewDetails.mode}</p>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Not scheduled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* AI assessments tab */}
        {activeTab === 'assessments' && (
          <div>
            <h2>Technical Skills Assessments</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Verify your technical proficiency. Scores above 70% will automatically add the skill tag to your profile and boost your AI match scores.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {['React', 'Node', 'JavaScript', 'Python'].map((skill) => (
                <button
                  key={skill}
                  className={`btn ${assessmentSkill.toLowerCase() === skill.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => startAssessment(skill.toLowerCase())}
                >
                  Start {skill} Test
                </button>
              ))}
            </div>

            {questions.length > 0 && !assessmentResult && (
              <div className="assessment-box">
                <h3>{assessmentSkill.toUpperCase()} Assessment</h3>
                {questions.map((q, idx) => (
                  <div className="question-card" key={q.id}>
                    <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{idx + 1}. {q.question}</p>
                    {q.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        className={`option-btn ${answers[q.id] === optIdx ? 'selected' : ''}`}
                        onClick={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                <button className="btn btn-accent" onClick={submitAssessmentAnswers} style={{ marginTop: '1rem' }}>
                  Submit Answers
                </button>
              </div>
            )}

            {assessmentResult !== null && (
              <div className="assessment-box" style={{ textAlign: 'center' }}>
                <h3>Assessment Results</h3>
                <h1 style={{ fontSize: '4rem', color: assessmentResult >= 70 ? 'var(--success)' : 'var(--danger)', margin: '1rem 0' }}>
                  {assessmentResult}%
                </h1>
                <p>
                  {assessmentResult >= 70 
                    ? 'Congratulations! You passed the assessment and the skill tag has been added to your profile.' 
                    : 'Study hard and try again next time.'}
                </p>
                <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => { setQuestions([]); setAssessmentResult(null); setAssessmentSkill(''); }}>
                  Close Results
                </button>
              </div>
            )}

            {user?.profile?.assessmentScores?.length > 0 && (
              <div>
                <h3>Past Assessment Scores</h3>
                <table className="premium-table" style={{ marginTop: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Skill Challenge</th>
                      <th>Test Score</th>
                      <th>Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.profile.assessmentScores.map((score, i) => (
                      <tr key={i}>
                        <td><strong>{score.skill.toUpperCase()}</strong></td>
                        <td>
                          <span className={`badge ${score.score >= 70 ? 'badge-success' : 'badge-danger'}`}>
                            {score.score}%
                          </span>
                        </td>
                        <td>{new Date(score.takenAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeekerDashboard;
