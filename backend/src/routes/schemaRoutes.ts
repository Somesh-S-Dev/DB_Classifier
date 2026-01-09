import { Router } from 'express';
import { getSchema } from '../controllers/schemaController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getSchema);

export default router;
