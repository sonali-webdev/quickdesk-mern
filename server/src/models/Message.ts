import { Schema, model } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Loading chat history = filter by ticket, sort by time
messageSchema.index({ ticket: 1, createdAt: 1 });

export const Message = model<IMessage>('Message', messageSchema);