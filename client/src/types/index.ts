export const TICKET_STATUSES = ['open', 'pending', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;

export type UserRole = 'customer' | 'agent';
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: { id: string; name: string };
  assignedAgent: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  tickets: Ticket[];
  page: number;
  limit: number;
  total: number;
}

export interface ChatMessage {
  id: string;
  ticketId: string;
  sender: { id: string; name: string; role: UserRole };
  content: string;
  createdAt: string;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority?: TicketPriority;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgent?: string | null;
}

export interface SocketAck { ok: boolean; error?: string; }