import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTicketChat } from '../hooks/useTicketChat';
import type { Ticket } from '../types';

interface Props {
  ticketId: string;
  closed: boolean;
  onTicketUpdated?: (ticket: Ticket) => void;
}

export default function ChatBox({ ticketId, closed, onTicketUpdated }: Props) {
  const { user } = useAuth();
  const { messages, connected, error, sendMessage } = useTicketChat(ticketId, onTicketUpdated);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSendError('');
    const res = await sendMessage(content);
    if (res.ok) setText('');
    else setSendError(res.error ?? 'Failed to send');
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <strong>Chat</strong>
        <span className={connected ? 'dot online' : 'dot'}>{connected ? 'Live' : 'Connecting...'}</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <p className="muted">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender.id === user?.id ? 'mine' : 'theirs'}`}>
            <div className="bubble-meta">{m.sender.name} · {m.sender.role}</div>
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {(error || sendError) && <p className="error">{sendError || error}</p>}

      {closed ? (
        <p className="muted">This ticket is closed. Chat is read-only.</p>
      ) : (
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Type a message..."
            disabled={!connected}
          />
          <button className="btn" type="submit" disabled={!connected || !text.trim()}>Send</button>
        </form>
      )}
    </div>
  );
}