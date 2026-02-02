import { Router } from 'express';
import { getPolicyRules, getPolicyRule } from '../controllers/rules.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all policy rules
router.get('/', getPolicyRules);

// Get specific policy rule
router.get('/:id', getPolicyRule);

export default router;
