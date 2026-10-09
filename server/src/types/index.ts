import { Types } from 'mongoose';

/* ------------------------------------------------------------------ */
/* Domain constants: single source of truth                            */
/* ------------------------------------------------------------------ */
// `as const` gives us runtime arrays (Step 2 will pass them to Mongoose's
// `enum` option) AND compile-time union types derived from the same list.
export const USER_ROLES = ['customer', 'agent'] as const;
export const TICKET_STATUSES = ['open', 'pending', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;

export type UserRole = (typeof USER_ROLES)[number];           // 'customer' | 'agent'
export type TicketStatus = (typeof TICKET_STATUSES)[number];  // 'open' | 'pending' | 'closed'
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]; // 'low' | 'medium' | 'high'

/* ------------------------------------------------------------------ */
/* Mongoose document shapes                                            */
/* ------------------------------------------------------------------ */
export interface IUser {
  id?: string; // Mongoose virtual getter for _id (string form); not stored
  name: string;
  email: string;
  password: string; // bcrypt hash; the schema will use select:false
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Instance methods live in a separate interface (used with Schema<IUser, Model, IUserMethods>)
export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export interface ITicket {
  id?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: Types.ObjectId;              // ref User (the creator)
  assignedAgent: Types.ObjectId | null;  // ref User; null = unassigned
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id?: string;
  ticket: Types.ObjectId; // ref Ticket
  sender: Types.ObjectId; // ref User
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */
// What we sign INTO the token and what auth middleware puts on req.user.
// JWTs are base64-encoded, NOT encrypted: never add email/password here.
export interface JWTPayload {
  id: string;
  role: UserRole;
}

/* ------------------------------------------------------------------ */
/* Socket.IO typed events                                              */
/* ------------------------------------------------------------------ */
// What we send over the wire (ObjectIds and Dates become strings in JSON).
export interface MessageDTO {
  id: string;
  ticketId: string;
  sender: { id: string; name: string; role: UserRole };
  content: string;
  createdAt: string; // ISO string
}

// Acknowledgement callback shape: the server replies success/failure to the sender.
export interface SocketAck {
  ok: boolean;
  error?: string;
}

// Events the SERVER emits to clients
export interface ServerToClientEvents {
  receiveMessage: (message: MessageDTO) => void;
}

// Events the CLIENT emits to the server
export interface ClientToServerEvents {
  joinTicket: (ticketId: string, ack: (res: SocketAck) => void) => void;
  leaveTicket: (ticketId: string) => void;
  sendMessage: (
    payload: { ticketId: string; content: string },
    ack: (res: SocketAck) => void
  ) => void;
}

// Required by Socket.IO's generic signature; we don't use server-to-server events.
export interface InterServerEvents {}

// Per-connection data, set once during the JWT handshake, read as socket.data.*
export interface SocketData {
  userId: string;
  role: UserRole;
  name: string;
}