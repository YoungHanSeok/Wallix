import { Router } from 'express';
import { adminLogin, checkAdminStatus } from '../middleware/admin-auth';
import { adminLimiter, loginLimiter } from '../middleware/security';

const router = Router();

router.use(adminLimiter);
router.post('/login', loginLimiter, adminLogin);
router.get('/status', checkAdminStatus);

export default router;