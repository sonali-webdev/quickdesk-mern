import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicketRequest } from '../api/tickets.api';
import { getErrorMessage } from '../api/client';
import { TICKET_PRIORITIES } from '../types';
import type { TicketPriority } from '../types';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Mirrors the server rules for fast feedback; the server is still the authority
    if (title.trim().length < 3) return setError('Title must be at least 3 characters');
    if (description.trim().length < 10) return setError('Description must be at least 10 characters');

    setSubmitting(true);
    try {
      const ticket = await createTicketRequest({ title: title.trim(), description: description.trim(), priority });
      navigate(`/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <h2>New ticket</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={2000} required />
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
            {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create ticket'}
        </button>
      </form>
    </div>
  );
}