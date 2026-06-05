import express from 'express';
import { getSystemStats, getUsers, deleteUserByAdmin } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUserByAdmin);

export default router;
