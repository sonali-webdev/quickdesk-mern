import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Ticket } from '../models/Ticket';
import { Message } from '../models/Message';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { MessageDTO, UserRole } from '../types';

export const getMessages = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new AppError(400, 'Invalid ticket id');

  const ticket = await Ticket.findById(id).select('customer');
  const isOwner = ticket?.customer.toString() === req.user!.id;
  // 404 for tickets you can't see, same as getTicket
  if (!ticket || (req.user!.role === 'customer' && !isOwner)) {
    throw new AppError(404, 'Ticket not found');
  }

  // Newest 100, then flipped to chronological order for display
  const docs = await Message.find({ ticket: id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('sender', 'name role');

  const messages: MessageDTO[] = docs.reverse().map((m) => {
    const sender = m.sender as unknown as { id: string; name: string; role: UserRole };
    return {
      id: m.id,
      ticketId: id,
      sender: { id: sender.id, name: sender.name, role: sender.role },
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    };
  });

  res.json({ messages });
});