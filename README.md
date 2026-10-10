# QuickDesk

A real-time customer support ticketing system. Customers raise support tickets and chat live with support agents; agents manage ticket status and assignment.

## Key Features

- JWT authentication with bcrypt-hashed passwords
- Two roles: **customer** and **agent**, enforced on the server
  - Customers create tickets and see only their own
  - Agents see all tickets, change status/priority, and assign tickets
- Ticket list with status and priority filters and pagination
- Real-time chat per ticket (Socket.IO), with persisted message history
- Live ticket updates: when an agent changes status or assignment, the customer's page updates without a refresh
- Chat becomes read-only when a ticket is closed
- Centralized error handling and request validation

## Technologies Used

| Layer | Stack |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Axios, socket.io-client |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Atlas), Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | Socket.IO |

## Project Structure

```
quickdesk-mern/
├── client/   # React + TypeScript (Vite)
│   └── src/ api/ components/ context/ hooks/ pages/ routes/ socket/ types/
└── server/   # Express + TypeScript
    └── src/ config/ controllers/ middleware/ models/ routes/ sockets/ types/ utils/ scripts/
```

## Setup and Installation

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster (free tier is fine).

```bash
git clone https://github.com/sonali-webdev/quickdesk-mern.git
cd quickdesk-mern
```

### Server

```bash
cd server
npm install
cp .env.example .env     # on Windows PowerShell: Copy-Item .env.example .env
                         # on Windows cmd: copy .env.example .env
```

Edit `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Frontend origin for CORS, e.g. `http://localhost:5173` |
| `MONGO_URI` | Atlas connection string, including the `quickdesk` database name |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | e.g. `7d` |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

In Atlas, add your IP under **Network Access**.

### Client

```bash
cd client
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
                         # Windows cmd: copy .env.example .env
```

`client/.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Running the Application

```bash
# Terminal 1
cd server
npm run seed:agent   # one-time: creates the dev agent account
npm run dev          # http://localhost:5000

# Terminal 2
cd client
npm run dev          # http://localhost:5173
```

**Dev-only agent account** (created by the seed script): `agent@quickdesk.com` / `Agent@12345`. Customers sign up through the Register page. Agents cannot self-register, by design.

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public (always creates a customer) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/tickets` | Customer |
| GET | `/api/tickets?status=&priority=&page=&limit=` | Customer (own) / Agent (all) |
| GET | `/api/tickets/:id` | Owner or agent |
| PATCH | `/api/tickets/:id` | Agent |
| GET | `/api/tickets/:id/messages` | Owner or agent |

**Socket.IO events**

| Event | Direction | Purpose |
|---|---|---|
| `joinTicket` | client to server | Join a ticket's room (access is checked) |
| `leaveTicket` | client to server | Leave the room |
| `sendMessage` | client to server | Send a chat message (access is re-checked every time) |
| `receiveMessage` | server to client | A new chat message in the room |
| `ticketUpdated` | server to client | The ticket's status, priority or assignment changed |

The JWT is verified in the connection handshake. Ticket access is checked on join and on every send, and `ticketUpdated` is only delivered to sockets that passed the join check.

## Design Decisions

- `role` is never read from the register body, which prevents privilege escalation.
- Filters are whitelisted against known enums, which blocks NoSQL operator injection.
- Tickets a user cannot access return 404, not 403, so ids aren't revealed.
- Messages live in their own collection rather than embedded in tickets, so chats can grow and paginate.
- Types are duplicated on the client instead of using a shared package, a deliberate tradeoff for speed.

## Code0 Usage

I installed and used Code0 (CodeZero) in VS Code while working on this project.

- **Git Tree:** I used it to commit and push. The screenshots commit (`docs: add Code0 screenshots`), the README commit and the live-updates commit were made and pushed from Code0's Git Tree. Earlier commits were made from the normal VS Code terminal, before I set up Code0.
- **Functions and Graph:** I used these to look at how the project is organised. Functions found the Express backend and its 8 routes, and Graph showed the client and server as two separate groups with clear folder dependencies. This matched the structure I had planned.
- **Screenshots:** they are in [`docs/screenshots/`](docs/screenshots).

I couldn't find a separate terminal inside Code0, so I used its Git Tree commit and push buttons, which run the same git operations.

## AI Development Experience

**Code0's AI chat did not work for me.** It needs a separate coding CLI (Claude Code, Codex, GitHub Copilot CLI or Cursor), and I didn't have one set up. The chat showed "No AI provider found" and a `spawn EINVAL` error (screenshot: `docs/screenshots/code0-no-provider.png`). So I did not use Code0 to generate code.

For AI help, I used **Claude in a normal chat window** as a pair programmer. I used it to plan the structure, draft code and talk through design choices. I did not copy answers blindly. For each part I did these things:

- ran `tsc` to catch type errors,
- tested the endpoints myself with PowerShell requests, including failure cases,
- tested the socket layer with a script that runs three users at once,
- tried the UI in two browsers (normal and incognito) to check live chat,
- read the security-sensitive code (auth, role checks, socket permissions) so I could explain why it is written that way.

When something broke, I read the error and found the cause myself, then fixed it.

## Tasks Where AI Assistance Was Used

**1. API creation: ticket endpoints with role-based access**
I built create, list, get and update endpoints for tickets. Customers only see their own tickets, and only agents can update them. I tested this with 10 cases: customer creates (201), customer updates (403), agent creates (403), another customer reads a ticket (404), a bad id (400), and a filter injection attempt (still 200, ignored).

**2. Real-time feature: Socket.IO chat**
The server checks the JWT when a socket connects, and checks again that the user may access the ticket on join and on every message. The sender always comes from the verified token, never from the message data. I wrote an integration script with 15 checks (bad token rejected, outsider can't join or send, message reaches the agent live, closed tickets reject messages), and all pass.

**3. Debugging: problems I found and fixed**
- `bcrypt` failed to install on Windows, so I switched to `bcryptjs`.
- Old model files used outdated field names, and `tsc` caught the mismatch.
- `asyncHandler` rejected routes with typed params like `req.params.id`, so I made it generic.
- The browser showed a blank page because of type imports; I fixed it with `import type`.
- Login failed because `client/.env` had the wrong content, which left `VITE_API_URL` undefined.
- The server couldn't reach MongoDB because Atlas blocked my changed IP address.

**4. Database integration**
I designed the User, Ticket and Message schemas in Mongoose. Passwords are hashed in a save hook and hidden from queries by default. Messages are in their own collection so a chat can grow without making the ticket huge. I added indexes that match the queries I actually run, and connected the app to MongoDB Atlas.

**5. Component development: live chat in React**
I built the `useTicketChat` hook and the `ChatBox` component. They load message history over REST, then add live messages from the socket. The socket closes when you leave the page, rejoins the ticket room after a reconnect, and ignores duplicate messages.

**6. Real-time ticket updates**
While testing, I noticed that when an agent changed a ticket's status or assignment, the customer had to refresh to see it. I fixed it by emitting a `ticketUpdated` event to the ticket's Socket.IO room after a successful update. The client listens for it and updates the page. Only users who passed the room authorization check receive the event. I tested it with a customer window and an agent window side by side.