import { AppServer } from './socket.types';

let io: AppServer | null = null;

export const setIO = (server: AppServer) => { io = server; };
export const getIO = (): AppServer | null => io;