import { Link } from 'react-router-dom';
import type { Ticket } from '../types';
import { PriorityBadge, StatusBadge } from './StatusBadge';

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-card">
      <div className="ticket-card-top">
        <h3>{ticket.title}</h3>
        <div className="badges">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <p className="muted">
        {ticket.customer.name} · {new Date(ticket.createdAt).toLocaleString()}
        {ticket.assignedAgent ? ` · Assigned to ${ticket.assignedAgent.name}` : ' · Unassigned'}
      </p>
    </Link>
  );
}