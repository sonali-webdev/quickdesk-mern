import { Request, Response } from 'express';
import { isValidObjectId, HydratedDocument } from 'mongoose';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getIO } from '../sockets/io';
import { roomFor } from '../sockets/chat.handler';
import {
  ITicket, TicketDTO, CreateTicketBody, UpdateTicketBody, TicketQuery,
  TICKET_STATUSES, TICKET_PRIORITIES,
} from '../types';

const POPULATE = [
  { path: 'customer', select: 'name' },
  { path: 'assignedAgent', select: 'name' },
];

// Map a populated Mongoose doc to a clean DTO so we never leak Mongoose internals
function toDTO(t: HydratedDocument<ITicket>): TicketDTO {
  const customer = t.customer as unknown as { id: string; name: string };
  const agent = t.assignedAgent as unknown as { id: string; name: string } | null;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    customer: { id: customer.id, name: customer.name },
    assignedAgent: agent ? { id: agent.id, name: agent.name } : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// Can this user see this ticket? (expects a populated customer)
export function canAccess(ticket: { customer: unknown }, user: { id: string; role: string }): boolean {
  if (user.role === 'agent') return true;
  const owner = ticket.customer as { id?: string; _id?: { toString(): string } };
  const ownerId = owner.id ?? owner._id?.toString();
  return ownerId === user.id;
}

export const createTicket = asyncHandler(
  async (req: Request<{}, {}, CreateTicketBody>, res: Response) => {
    const { title, description, priority } = req.body;
    const ticket = await Ticket.create({
      title,
      description,
      priority, // undefined falls back to the schema default
      customer: req.user!.id,
    });
    await ticket.populate(POPULATE);
    res.status(201).json({ ticket: toDTO(ticket) });
  }
);

export const listTickets = asyncHandler(
  async (req: Request<{}, {}, {}, TicketQuery>, res: Response) => {
    const { status, priority } = req.query;
    const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '20', 10) || 20, 1), 50);

    const filter: Record<string, unknown> = {};
    // Role-based scoping happens on the SERVER, never from a client-supplied id
    if (req.user!.role === 'customer') filter.customer = req.user!.id;
    // Whitelist filter values (also blocks NoSQL injection via ?status[$ne]=x)
    if (typeof status === 'string' && (TICKET_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (typeof priority === 'string' && (TICKET_PRIORITIES as readonly string[]).includes(priority)) {
      filter.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(POPULATE),
      Ticket.countDocuments(filter),
    ]);

    res.json({ tickets: tickets.map(toDTO), page, limit, total });
  }
);

export const getTicket = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid ticket id');

  const ticket = await Ticket.findById(req.params.id).populate(POPULATE);
  // 404 (not 403) for other people's tickets: don't reveal that the id exists
  if (!ticket || !canAccess(ticket, req.user!)) throw new AppError(404, 'Ticket not found');

  res.json({ ticket: toDTO(ticket) });
});

export const updateTicket = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateTicketBody>, res: Response) => {
    if (!isValidObjectId(req.params.id)) throw new AppError(400, 'Invalid ticket id');

    const { status, priority, assignedAgent } = req.body;
    const update: Partial<Pick<ITicket, 'status' | 'priority'>> & { assignedAgent?: string | null } = {};

    if (status !== undefined) {
      if (!(TICKET_STATUSES as readonly string[]).includes(status)) throw new AppError(400, 'Invalid status');
      update.status = status;
    }
    if (priority !== undefined) {
      if (!(TICKET_PRIORITIES as readonly string[]).includes(priority)) throw new AppError(400, 'Invalid priority');
      update.priority = priority;
    }
    if (assignedAgent !== undefined) {
      if (assignedAgent !== null) {
        if (typeof assignedAgent !== 'string' || !isValidObjectId(assignedAgent)) {
          throw new AppError(400, 'Invalid agent id');
        }
        const agent = await User.findById(assignedAgent);
        if (!agent || agent.role !== 'agent') throw new AppError(400, 'Assignee must be an agent');
      }
      update.assignedAgent = assignedAgent;
    }
    if (Object.keys(update).length === 0) throw new AppError(400, 'Nothing to update');

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate(POPULATE);
    if (!ticket) throw new AppError(404, 'Ticket not found');

    const dto = toDTO(ticket);
    // Push the change to everyone who has joined this ticket's room.
    // `?.` keeps the REST update working even if the socket server isn't up.
    getIO()?.to(roomFor(dto.id)).emit('ticketUpdated', dto);

    res.json({ ticket: dto });
  }
);