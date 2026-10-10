import { useEffect, useState } from 'react';
import { listTicketsRequest } from '../api/tickets.api';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../types';
import type { Ticket, TicketPriority, TicketStatus } from '../types';

const LIMIT = 10;

export default function TicketListPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Guards against a slow old response overwriting a newer one
    let cancelled = false;
    setLoading(true);
    setError('');

    listTicketsRequest({ status, priority, page, limit: LIMIT })
      .then((data) => {
        if (cancelled) return;
        setTickets(data.tickets);
        setTotal(data.total);
      })
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [status, priority, page]);

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <div>
      <h2>{user?.role === 'agent' ? 'All tickets' : 'My tickets'}</h2>

      <div className="filters">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as TicketStatus | ''); setPage(1); }}
        >
          <option value="">All statuses</option>
          {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as TicketPriority | ''); setPage(1); }}
        >
          <option value="">All priorities</option>
          {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading && <p className="muted">Loading tickets...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && tickets.length === 0 && (
        <p className="muted">No tickets found.</p>
      )}

      <div className="ticket-list">
        {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
      </div>

      {total > LIMIT && (
        <div className="pagination">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}