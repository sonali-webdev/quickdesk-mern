import { io, Socket } from 'socket.io-client';
import { TOKEN_KEY } from '../api/client';

// Created per ticket page, not as a global singleton, so it always
// carries the CURRENT user's token and is closed on leaving the page.
export function createSocket(): Socket {
  return io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token: localStorage.getItem(TOKEN_KEY) },
  });
}