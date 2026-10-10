import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateCreateTicket } from '../middleware/validate';
import { createTicket, listTickets, getTicket, updateTicket } from '../controllers/ticket.controller';

const router = Router();

router.use(protect); // every ticket route requires login

router.post('/', authorize('customer'), validateCreateTicket, createTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.patch('/:id', authorize('agent'), updateTicket);

export default router;