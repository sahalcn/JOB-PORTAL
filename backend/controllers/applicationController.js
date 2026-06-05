import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Predefined mock skill assessment questions
const assessmentBank = {
  react: [
    { id: 1, question: "What is the purpose of React's virtual DOM?", options: ["To directly manipulate HTML", "To store state globally", "To optimize rendering performance by minimizing reflows", "To fetch data from API"], answer: 2 },
    { id: 2, question: "Which hook is used to perform side effects in React?", options: ["useState", "useContext", "useEffect", "useMemo"], answer: 2 },
    { id: 3, question: "How does React propagate data down to child components?", options: ["Via context only", "Via state", "Via props", "Via redux"], answer: 2 }
  ],
  node: [
    { id: 1, question: "Is Node.js single-threaded or multi-threaded by default?", options: ["Multi-threaded", "Single-threaded", "It depends on the OS", "None of the above"], answer: 1 },
    { id: 2, question: "Which module is used to create web servers in Node.js?", options: ["fs", "path", "http", "os"], answer: 2 },
    { id: 3, question: "What pattern is Node.js architecture built on?", options: ["Event-driven, non-blocking I/O", "Synchronous blocking I/O", "Object Oriented MVC", "Model-View-ViewModel"], answer: 0 }
  ],
  javascript: [
    { id: 1, question: "What does 'typeof null' return in JavaScript?", options: ["'null'", "'undefined'", "'object'", "'string'"], answer: 2 },
    { id: 2, question: "Which method creates a new array with all elements that pass a test?", options: ["map()", "filter()", "forEach()", "reduce()"], answer: 1 },
    { id: 3, question: "What is the scope of a variable declared with 'let'?", options: ["Global scope", "Function scope", "Block scope", "No scope"], answer: 2 }
  ],
  python: [
    { id: 1, question: "How do you start a comment in Python?", options: ["//", "/*", "#", "<!--"], answer: 2 },
    { id: 2, question: "Which data type is mutable in Python?", options: ["tuple", "list", "string", "int"], answer: 1 },
    { id: 3, question: "How is code blocks defined in Python?", options: ["Curly braces", "Parentheses", "Indentation", "Semicolons"], answer: 2 }
  ]
};

// Resume parsing helper: Extracts skills and details using keyword matching
const parseResumeText = (text) => {
  const commonSkills = ['react', 'node', 'express', 'mongodb', 'javascript', 'python', 'java', 'html', 'css', 'typescript', 'sql', 'git', 'docker', 'aws'];
  const foundSkills = [];
  
  const cleanText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (cleanText.includes(skill)) {
      foundSkills.push(skill);
    }
  });

  // Basic Experience detection (e.g. "3 years of experience", "2+ years")
  let experience = 0;
  const expMatch = cleanText.match(/(\d+)\s*(?:\+)?\s*year[s]?\s*(?:of\s*)?experience/i);
  if (expMatch) {
    experience = parseInt(expMatch[1], 10);
  }

  // Basic Education detection
  let education = 'Not specified';
  if (cleanText.includes('bachelor') || cleanText.includes('b.s.') || cleanText.includes('b.e.') || cleanText.includes('btech')) {
    education = 'Bachelor\'s Degree';
  } else if (cleanText.includes('master') || cleanText.includes('m.s.') || cleanText.includes('mtech')) {
    education = 'Master\'s Degree';
  } else if (cleanText.includes('phd') || cleanText.includes('doctorate')) {
    education = 'PhD';
  }

  return {
    skills: foundSkills,
    experience,
    education
  };
};

// @desc    Apply for a job (including resume upload/parsing simulation)
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker)
export const applyForJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if already applied
    const alreadyApplied = await Application.findOne({
      job: req.params.jobId,
      seeker: req.user._id
    });

    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    // Capture resume file details
    const resumeUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_resume.pdf';
    
    // Simulate text reading (or use file content if provided)
    // If the request contains text content (e.g. paste resume or simulated upload data), parse it
    const simulatedResumeText = req.body.resumeText || `Skillset: ${req.user.profile.skills.join(', ')}. Experience: ${req.user.profile.experience} years.`;

    const parsedData = parseResumeText(simulatedResumeText);

    // Save parsed details into User profile if profile is blank
    const user = await User.findById(req.user._id);
    if (user) {
      user.profile.resumeUrl = resumeUrl;
      user.profile.resumeText = simulatedResumeText;
      // Merge skills if any parsed
      if (parsedData.skills.length > 0) {
        const mergedSkills = new Set([...user.profile.skills, ...parsedData.skills]);
        user.profile.skills = Array.from(mergedSkills);
      }
      if (parsedData.experience > 0 && user.profile.experience === 0) {
        user.profile.experience = parsedData.experience;
      }
      if (parsedData.education !== 'Not specified' && !user.profile.education) {
        user.profile.education = parsedData.education;
      }
      await user.save();
    }

    // Calculate AI Job Match Score (simple matching calculation)
    // Formula: (matching skills count / required skills count) * 60% + (experience level check) * 40%
    let matchScore = 0;
    const requiredSkills = job.requirements.map(s => s.toLowerCase());
    const seekerSkills = user ? user.profile.skills.map(s => s.toLowerCase()) : [];

    if (requiredSkills.length > 0) {
      const matchCount = requiredSkills.filter(skill => seekerSkills.includes(skill)).length;
      matchScore += (matchCount / requiredSkills.length) * 60;
    } else {
      matchScore += 60; // default skill match if no skills specified
    }

    // Experience matching
    const experienceRequired = job.experienceLevel === 'Entry Level' ? 0 
      : job.experienceLevel === 'Mid Level' ? 2 
      : job.experienceLevel === 'Senior Level' ? 5 
      : 8;
    
    const userExp = user ? user.profile.experience : 0;
    if (userExp >= experienceRequired) {
      matchScore += 40;
    } else if (userExp > 0) {
      matchScore += (userExp / experienceRequired) * 40;
    }

    matchScore = Math.min(Math.round(matchScore), 100);

    const application = await Application.create({
      job: job._id,
      seeker: req.user._id,
      resumeUrl,
      matchScore,
      assessmentScore: user ? (user.profile.assessmentScores[0]?.score || null) : null
    });

    // Notify Employer
    await Notification.create({
      recipient: job.employer,
      message: `${req.user.name} applied for "${job.title}". Match Score: ${matchScore}%`,
      type: 'Job Post'
    });

    res.status(201).json({
      success: true,
      data: application,
      parsedDetails: parsedData,
      matchScore
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seeker applications
// @route   GET /api/applications/seeker/me
// @access  Private (Job Seeker)
export const getSeekerApplications = async (req, res) => {
  try {
    const applications = await Application.find({ seeker: req.user._id })
      .populate({
        path: 'job',
        select: 'title company location salary jobType'
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get job applicants (Employer view)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer)
export const getJobApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('seeker', 'name email profile')
      .sort({ matchScore: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule interview
// @route   PUT /api/applications/:id/interview
// @access  Private (Employer)
export const scheduleInterview = async (req, res) => {
  const { dateTime, mode, link, notes } = req.body;

  try {
    const application = await Application.findById(req.params.id).populate({
      path: 'job',
      select: 'title employer'
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.job.employer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to schedule interview' });
    }

    application.interviewDetails = { dateTime, mode, link, notes };
    application.status = 'Interview Scheduled';
    await application.save();

    // Notify Seeker
    await Notification.create({
      recipient: application.seeker,
      message: `Interview scheduled for "${application.job.title}". Mode: ${mode} on ${new Date(dateTime).toLocaleString()}`,
      type: 'Interview Scheduled'
    });

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assessment questions
// @route   GET /api/applications/assessment/:skill
// @access  Private (Job Seeker)
export const getAssessmentQuestions = (req, res) => {
  const skill = req.params.skill.toLowerCase();
  const questions = assessmentBank[skill];

  if (!questions) {
    return res.status(404).json({ success: false, message: 'Assessment for this skill is not available. Choose react, node, javascript, or python.' });
  }

  // Remove answers before sending to front-end
  const secureQuestions = questions.map(({ id, question, options }) => ({ id, question, options }));
  res.json({ success: true, data: secureQuestions });
};

// @desc    Submit assessment
// @route   POST /api/applications/assessment/:skill
// @access  Private (Job Seeker)
export const submitAssessment = async (req, res) => {
  const skill = req.params.skill.toLowerCase();
  const { answers } = req.body; // Map of { questionId: selectedIndex }

  const questions = assessmentBank[skill];
  if (!questions) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }

  try {
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const user = await User.findById(req.user._id);
    if (user) {
      // Remove previous score if exists for same skill
      user.profile.assessmentScores = user.profile.assessmentScores.filter(s => s.skill !== skill);
      user.profile.assessmentScores.push({ skill, score });
      
      // Auto-add skill to user's profile if score is >= 70
      if (score >= 70 && !user.profile.skills.includes(skill)) {
        user.profile.skills.push(skill);
      }
      
      await user.save();
    }

    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get job recommendations (Matching Job list based on seeker profile)
// @route   GET /api/applications/seeker/matching
// @access  Private (Job Seeker)
export const getMatchingJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const seekerSkills = user.profile.skills.map(s => s.toLowerCase());
    
    // Find all jobs that have at least one matching skill or default to top recent jobs
    const jobs = await Job.find({}).populate('employer', 'name company');

    const recommendedJobs = jobs.map(job => {
      let score = 0;
      const requiredSkills = job.requirements.map(s => s.toLowerCase());

      if (requiredSkills.length > 0) {
        const matchCount = requiredSkills.filter(skill => seekerSkills.includes(skill)).length;
        score += (matchCount / requiredSkills.length) * 60;
      } else {
        score += 60;
      }

      const experienceRequired = job.experienceLevel === 'Entry Level' ? 0 
        : job.experienceLevel === 'Mid Level' ? 2 
        : job.experienceLevel === 'Senior Level' ? 5 
        : 8;
      
      if (user.profile.experience >= experienceRequired) {
        score += 40;
      } else if (user.profile.experience > 0) {
        score += (user.profile.experience / experienceRequired) * 40;
      }

      return {
        job,
        matchScore: Math.min(Math.round(score), 100)
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, data: recommendedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
