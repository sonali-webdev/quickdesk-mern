import { Router } from 'express';
import authRoutes from './auth.routes';
import ticketRoutes from './ticket.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);

export default router;