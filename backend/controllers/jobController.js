import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private (Employer or Admin)
export const createJob = async (req, res) => {
  const { title, company, description, requirements, salary, location, jobType, experienceLevel } = req.body;

  try {
    const skillsArray = Array.isArray(requirements) 
      ? requirements.map(s => s.trim().toLowerCase()).filter(Boolean)
      : requirements ? requirements.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

    const job = await Job.create({
      title,
      company,
      description,
      requirements: skillsArray,
      salary,
      location,
      jobType,
      experienceLevel,
      employer: req.user._id,
    });

    // Notify job seekers who match these skills (simulating job alert matching)
    const matchingSeekers = await User.find({
      role: 'Job Seeker',
      'profile.skills': { $in: skillsArray }
    });

    for (const seeker of matchingSeekers) {
      await Notification.create({
        recipient: seeker._id,
        message: `New matching job posted: "${title}" at ${company}!`,
        type: 'Job Post'
      });
    }

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all jobs (with query search)
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const { keyword, location, jobType, experienceLevel } = req.query;
    let query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { company: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { requirements: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    const jobs = await Job.find(query).populate('employer', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'name email');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Employer or Admin)
export const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check ownership
    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    const { title, company, description, requirements, salary, location, jobType, experienceLevel } = req.body;
    let skillsArray = job.requirements;
    if (requirements) {
      skillsArray = Array.isArray(requirements) 
        ? requirements.map(s => s.trim().toLowerCase()).filter(Boolean)
        : requirements.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title: title || job.title,
        company: company || job.company,
        description: description || job.description,
        requirements: skillsArray,
        salary: salary || job.salary,
        location: location || job.location,
        jobType: jobType || job.jobType,
        experienceLevel: experienceLevel || job.experienceLevel
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer or Admin)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check ownership
    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get jobs posted by logged-in Employer
// @route   GET /api/jobs/employer/me
// @access  Private (Employer)
export const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
