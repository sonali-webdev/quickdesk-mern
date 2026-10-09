import { Schema, model } from 'mongoose';
import { ITicket, TICKET_STATUSES, TICKET_PRIORITIES } from '../types';

const ticketSchema = new Schema<ITicket>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium' },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Indexes match real queries: "my tickets" and "agent filters by status"
ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ status: 1, assignedAgent: 1, createdAt: -1 });

export const Ticket = model<ITicket>('Ticket', ticketSchema);