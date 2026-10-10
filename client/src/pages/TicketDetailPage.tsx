import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTicketRequest, updateTicketRequest } from '../api/tickets.api';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ChatBox from '../components/ChatBox';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { TICKET_STATUSES } from '../types';
import type { Ticket, TicketStatus } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getTicketRequest(id)
      .then((t) => !cancelled && setTicket(t))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p className="muted">Loading ticket...</p>;
  if (error || !ticket || !id) {
    return (
      <div>
        <p className="error">{error || 'Ticket not found'}</p>
        <Link to="/tickets">Back to tickets</Link>
      </div>
    );
  }

  const isAgent = user?.role === 'agent';

  const changeStatus = async (status: TicketStatus) => {
    setActionError('');
    try {
      setTicket(await updateTicketRequest(id, { status }));
    } catch (e) {
      setActionError(getErrorMessage(e));
    }
  };

  const toggleAssign = async () => {
    setActionError('');
    try {
      const assignedAgent = ticket.assignedAgent?.id === user?.id ? null : user!.id;
      setTicket(await updateTicketRequest(id, { assignedAgent }));
    } catch (e) {
      setActionError(getErrorMessage(e));
    }
  };

  return (
    <div>
      <Link to="/tickets">← Back to tickets</Link>

      <div className="detail-card">
        <div className="ticket-card-top">
          <h2>{ticket.title}</h2>
          <div className="badges">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="muted">
          By {ticket.customer.name} · {new Date(ticket.createdAt).toLocaleString()} ·{' '}
          {ticket.assignedAgent ? `Assigned to ${ticket.assignedAgent.name}` : 'Unassigned'}
        </p>
        <p className="description">{ticket.description}</p>

        {isAgent && (
          <div className="agent-controls">
            <select value={ticket.status} onChange={(e) => changeStatus(e.target.value as TicketStatus)}>
              {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={toggleAssign}>
              {ticket.assignedAgent?.id === user?.id ? 'Unassign me' : 'Assign to me'}
            </button>
          </div>
        )}
        {actionError && <p className="error">{actionError}</p>}
      </div>

      <ChatBox ticketId={id} closed={ticket.status === 'closed'} />
    </div>
  );
}