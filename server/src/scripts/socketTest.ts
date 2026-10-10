import { io, Socket } from 'socket.io-client';

const HOST = 'http://localhost:5000';

async function api(path: string, token?: string, method = 'GET', body?: unknown): Promise<any> {
  const res = await fetch(`${HOST}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const login = async (email: string, password: string) =>
  (await api('/auth/login', undefined, 'POST', { email, password })).token as string;

function connect(token?: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = io(HOST, { auth: { token }, transports: ['websocket'] });
    s.on('connect', () => resolve(s));
    s.on('connect_error', (e) => { s.close(); reject(e); });
  });
}

const emitAck = (s: Socket, event: string, ...args: unknown[]): Promise<any> =>
  new Promise((resolve) => s.emit(event, ...args, resolve));

function check(name: string, ok: boolean) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const custToken = await login('test@example.com', 'password123');
  const agentToken = await login('agent@quickdesk.com', 'Agent@12345');
  const otherToken = await login('other@example.com', 'password123');

  const created = await api('/tickets', custToken, 'POST', {
    title: 'Socket test ticket',
    description: 'Created by the socket test script to check chat.',
  });
  const ticketId: string = created.ticket.id;

  // 1. Connection auth
  let rejected = false;
  await connect().catch(() => { rejected = true; });
  check('connect without token is rejected', rejected);

  rejected = false;
  await connect('garbage.token.value').catch(() => { rejected = true; });
  check('connect with bad token is rejected', rejected);

  const cust = await connect(custToken);
  const agent = await connect(agentToken);
  const other = await connect(otherToken);
  check('valid tokens connect', cust.connected && agent.connected && other.connected);

  // 2. Room authorization
  check('owner can join', (await emitAck(cust, 'joinTicket', ticketId)).ok === true);
  check('agent can join', (await emitAck(agent, 'joinTicket', ticketId)).ok === true);
  check('other customer cannot join', (await emitAck(other, 'joinTicket', ticketId)).ok === false);
  check('bad ticket id is rejected', (await emitAck(cust, 'joinTicket', 'abc')).ok === false);

  // 3. Real-time delivery: agent should receive what the customer sends
  const received = new Promise<any>((resolve) => agent.once('receiveMessage', resolve));
  const sent = await emitAck(cust, 'sendMessage', { ticketId, content: '  Hello, I need help  ' });
  check('customer message is acknowledged', sent.ok === true);
  const msg = await Promise.race([received, new Promise((r) => setTimeout(() => r(null), 3000))]);
  check('agent receives message in real time', msg?.content === 'Hello, I need help');
  check('sender identity comes from the token', msg?.sender?.role === 'customer');

  // 4. Authorization on send
  const outsider = await emitAck(other, 'sendMessage', { ticketId, content: 'let me in' });
  check('non-member cannot send', outsider.ok === false);
  const empty = await emitAck(cust, 'sendMessage', { ticketId, content: '   ' });
  check('empty message is rejected', empty.ok === false);

  // 5. History endpoint
  const history = await api(`/tickets/${ticketId}/messages`, custToken);
  check('history returns the saved message', history.messages?.length === 1);
  const blocked = await api(`/tickets/${ticketId}/messages`, otherToken);
  check('other customer cannot read history', blocked.message === 'Ticket not found');

  // 6. Closed tickets
  await api(`/tickets/${ticketId}`, agentToken, 'PATCH', { status: 'closed' });
  const closed = await emitAck(cust, 'sendMessage', { ticketId, content: 'still there?' });
  check('closed ticket rejects messages', closed.ok === false);

  [cust, agent, other].forEach((s) => s.close());
}

main().catch((e) => { console.error(e); process.exit(1); });