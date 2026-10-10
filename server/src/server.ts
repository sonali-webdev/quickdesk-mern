import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './sockets';

async function start() {
  await connectDB();

  // Socket.IO needs the raw http.Server, so we wrap the Express app
  // instead of calling app.listen().
  const server = http.createServer(app);

  // Attach Socket.IO to the SAME server so HTTP and WebSocket share port 5000
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start();