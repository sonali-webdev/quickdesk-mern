import { api } from './client';
import type {
  Ticket, TicketListResponse, CreateTicketInput, UpdateTicketInput,
  TicketStatus, TicketPriority, ChatMessage,
} from '../types';

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  page?: number;
  limit?: number;
}

export const listTicketsRequest = (filters: TicketFilters) => {
  // Drop empty values so we never send ?status= to the server
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  );
  return api.get<TicketListResponse>('/tickets', { params }).then((r) => r.data);
};

export const getTicketRequest = (id: string) =>
  api.get<{ ticket: Ticket }>(`/tickets/${id}`).then((r) => r.data.ticket);

export const createTicketRequest = (data: CreateTicketInput) =>
  api.post<{ ticket: Ticket }>('/tickets', data).then((r) => r.data.ticket);

export const updateTicketRequest = (id: string, data: UpdateTicketInput) =>
  api.patch<{ ticket: Ticket }>(`/tickets/${id}`, data).then((r) => r.data.ticket);

export const getMessagesRequest = (id: string) =>
  api.get<{ messages: ChatMessage[] }>(`/tickets/${id}/messages`).then((r) => r.data.messages);