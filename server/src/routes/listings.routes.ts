import { Router } from 'express';
import {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
} from '../controllers/listings.controller.js';
import { authenticate, requireOwnership } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Listing CRUD operations
router.post('/', createListing);
router.get('/', getListings);
router.get('/:id', requireOwnership('listing'), getListing);
router.patch('/:id', requireOwnership('listing'), updateListing);
router.delete('/:id', requireOwnership('listing'), deleteListing);

export default router;
