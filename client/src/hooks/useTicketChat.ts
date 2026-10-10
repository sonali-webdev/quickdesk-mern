import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket } from '../socket/socket';
import { getMessagesRequest } from '../api/tickets.api';
import type { ChatMessage, SocketAck, Ticket } from '../types';

export function useTicketChat(ticketId: string, onTicketUpdated?: (t: Ticket) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  // Keep the latest callback in a ref so the socket effect doesn't have to
  // re-run (and reconnect) every time the parent re-renders.
  const updateRef = useRef(onTicketUpdated);
  useEffect(() => {
    updateRef.current = onTicketUpdated;
  });

  useEffect(() => {
    let cancelled = false;
    const socket = createSocket();
    socketRef.current = socket;

    // Load history over REST, then live messages append via the socket
    getMessagesRequest(ticketId)
      .then((history) => { if (!cancelled) setMessages(history); })
      .catch(() => { if (!cancelled) setError('Could not load messages'); });

    const join = () => {
      socket.emit('joinTicket', ticketId, (res: SocketAck) => {
        if (cancelled) return;
        setConnected(res.ok);
        if (!res.ok) setError(res.error ?? 'Could not join chat');
      });
    };

    // 'connect' fires on first connect AND on every reconnect.
    // Rooms are lost on disconnect, so we must re-join each time.
    socket.on('connect', join);
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setError('Chat connection failed'));

    socket.on('receiveMessage', (msg: ChatMessage) => {
      if (msg.ticketId !== ticketId) return;
      // Dedupe by id in case history and a live message overlap
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    // An agent changed status, priority or assignment
    socket.on('ticketUpdated', (t: Ticket) => {
      if (t.id === ticketId) updateRef.current?.(t);
    });

    return () => {
      cancelled = true;
      socket.emit('leaveTicket', ticketId);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [ticketId]);

  const sendMessage = useCallback((content: string): Promise<SocketAck> => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return resolve({ ok: false, error: 'Not connected' });
      }
      socket.emit('sendMessage', { ticketId, content }, resolve);
    });
  }, [ticketId]);

  return { messages, connected, error, sendMessage };
}