import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { User } from '../models/User';
import { verifyToken } from '../utils/jwt';
import { AppServer } from './socket.types';
import { registerChatHandlers } from './chat.handler';
import { setIO } from './io';

export function initSocket(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });
 setIO(io); 

  // Runs ONCE per connection, before 'connection' fires. Reject here = never connected.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string') return next(new Error('Not authenticated'));

      const payload = verifyToken(token);
      // Fresh DB lookup: a deleted or demoted user can't connect on an old token
      const user = await User.findById(payload.id).select('name role');
      if (!user) return next(new Error('Not authenticated'));

      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.name = user.name;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => registerChatHandlers(io, socket));
  return io;
}