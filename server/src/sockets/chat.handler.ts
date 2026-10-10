import { isValidObjectId } from 'mongoose';
import { Ticket } from '../models/Ticket';
import { Message } from '../models/Message';
import { MessageDTO, SocketAck } from '../types';
import { AppServer, AppSocket } from './socket.types';

// Namespaced room name. NEVER join a raw client-supplied string as a room.
const roomFor = (ticketId: string) => `ticket:${ticketId}`;

const reply = (ack: unknown, res: SocketAck) => {
  if (typeof ack === 'function') ack(res);
};

// Returns the ticket only if this socket's user may access it.
async function loadAuthorizedTicket(ticketId: unknown, socket: AppSocket) {
  if (typeof ticketId !== 'string' || !isValidObjectId(ticketId)) return null;
  const ticket = await Ticket.findById(ticketId).select('customer status');
  if (!ticket) return null;

  const isAgent = socket.data.role === 'agent';
  const isOwner = ticket.customer.toString() === socket.data.userId;
  return isAgent || isOwner ? ticket : null;
}

export function registerChatHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('joinTicket', async (ticketId, ack) => {
    try {
      const ticket = await loadAuthorizedTicket(ticketId, socket);
      if (!ticket) return reply(ack, { ok: false, error: 'Ticket not found' });

      await socket.join(roomFor(ticketId));
      reply(ack, { ok: true });
    } catch (err) {
      console.error('joinTicket failed:', err);
      reply(ack, { ok: false, error: 'Could not join ticket' });
    }
  });

  socket.on('leaveTicket', (ticketId) => {
    if (typeof ticketId === 'string') socket.leave(roomFor(ticketId));
  });

  socket.on('sendMessage', async (payload, ack) => {
    try {
      const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
      if (content.length < 1 || content.length > 1000) {
        return reply(ack, { ok: false, error: 'Message must be 1 to 1000 characters' });
      }

      // Re-check access on EVERY send. Being in a room is not authorization.
      const ticket = await loadAuthorizedTicket(payload?.ticketId, socket);
      if (!ticket) return reply(ack, { ok: false, error: 'Ticket not found' });
      if (ticket.status === 'closed') {
        return reply(ack, { ok: false, error: 'This ticket is closed' });
      }

      // Sender comes from the verified socket, never from the payload
      const message = await Message.create({
        ticket: ticket._id,
        sender: socket.data.userId,
        content,
      });

      const dto: MessageDTO = {
        id: message.id,
        ticketId: ticket.id,
        sender: { id: socket.data.userId, name: socket.data.name, role: socket.data.role },
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };

      // Save first, broadcast second: anything users see is already persisted
      io.to(roomFor(ticket.id)).emit('receiveMessage', dto);
      reply(ack, { ok: true });
    } catch (err) {
      console.error('sendMessage failed:', err);
      reply(ack, { ok: false, error: 'Could not send message' });
    }
  });
}