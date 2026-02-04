import { Router } from 'express';
import {
  getAllPolicyRules,
  getPolicyRuleById,
  createPolicyRule,
  updatePolicyRule,
  togglePolicyRuleStatus,
  deletePolicyRule,
  bulkUpdatePolicyRules,
  getPolicyRuleStats,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Policy Rules Management
router.get('/policy-rules', getAllPolicyRules);
router.get('/policy-rules/stats', getPolicyRuleStats);
router.get('/policy-rules/:id', getPolicyRuleById);
router.post('/policy-rules', createPolicyRule);
router.put('/policy-rules/:id', updatePolicyRule);
router.patch('/policy-rules/:id/toggle', togglePolicyRuleStatus);
router.delete('/policy-rules/:id', deletePolicyRule);
router.post('/policy-rules/bulk-update', bulkUpdatePolicyRules);

export default router;
