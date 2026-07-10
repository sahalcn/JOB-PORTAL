import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  applyForJob,
  getSeekerApplications,
  getJobApplicants,
  scheduleInterview,
  getAssessmentQuestions,
  submitAssessment,
  getMatchingJobs,
  parseResume
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Resume Parsing Route
router.post('/parse-resume', protect, authorize('Job Seeker'), parseResume);

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const filetypes = /pdf|doc|docx|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only resumes of format .pdf, .doc, .docx, .txt are allowed'));
    }
  },
});

// Seeker routes
router.post('/apply/:jobId', protect, authorize('Job Seeker'), upload.single('resume'), applyForJob);
router.get('/seeker/me', protect, authorize('Job Seeker'), getSeekerApplications);
router.get('/matching', protect, authorize('Job Seeker'), getMatchingJobs);
router.get('/assessment/:skill', protect, authorize('Job Seeker'), getAssessmentQuestions);
router.post('/assessment/:skill', protect, authorize('Job Seeker'), submitAssessment);

// Employer routes
router.get('/job/:jobId', protect, authorize('Employer', 'Admin'), getJobApplicants);
router.put('/:id/interview', protect, authorize('Employer', 'Admin'), scheduleInterview);

export default router;
