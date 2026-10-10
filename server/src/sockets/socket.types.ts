import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '../types';

// Typed aliases so socket.on / socket.emit / socket.data are all type-checked
export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;