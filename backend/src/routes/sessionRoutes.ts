import { Router } from 'express';
import { saveSession, listSessions, getSession, getLatestSession, deleteSession, exportSession } from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/save', authenticateToken as any, saveSession);
router.get('/latest', authenticateToken as any, getLatestSession);
router.get('/list', authenticateToken as any, listSessions);
router.get('/:id', authenticateToken as any, getSession);
router.post('/export', authenticateToken as any, exportSession);
router.delete('/:id', authenticateToken as any, deleteSession);

export default router;
