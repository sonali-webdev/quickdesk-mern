import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);
app.use(errorHandler); 

export default app;