import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

async function start() {
  await connectDB();

  // Socket.IO needs the raw http.Server, so we wrap the Express app
  // instead of calling app.listen(). We'll attach Socket.IO here later.
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start();