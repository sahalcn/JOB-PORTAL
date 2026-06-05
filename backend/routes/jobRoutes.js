import express from 'express';
import { createJob, getJobs, getJobById, updateJob, deleteJob, getEmployerJobs } from '../controllers/jobController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('Employer', 'Admin'), createJob)
  .get(getJobs);

router.get('/employer/me', protect, authorize('Employer'), getEmployerJobs);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorize('Employer', 'Admin'), updateJob)
  .delete(protect, authorize('Employer', 'Admin'), deleteJob);

export default router;
