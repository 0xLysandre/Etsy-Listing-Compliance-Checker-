import { Router } from 'express';
import {
  runComplianceCheck,
  getCheckHistory,
  getCheckResult,
} from '../controllers/checks.controller.js';
import { authenticate, requireOwnership } from '../middleware/auth.js';
import { checkLimiter } from '../middleware/rateLimit.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Run a compliance check on a listing
router.post('/listing/:listingId', checkLimiter, runComplianceCheck);

// Get check history for a listing
router.get('/listing/:listingId/history', getCheckHistory);

// Get specific check result
router.get('/:id', requireOwnership('check'), getCheckResult);

export default router;
