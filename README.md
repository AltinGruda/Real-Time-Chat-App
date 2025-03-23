# Real-Time Chat Application

A modern real-time chat application built with Node.js, Socket.io, Redis, and React.js.

## Features

- Real-time messaging with Socket.io
- Multiple chat rooms
- User presence indicators
- Typing indicators
- Message history with Redis
- Modern, responsive UI
- User authentication (username-based)

## Prerequisites

- Node.js (v14 or higher)
- Redis server
- npm or yarn

## Project Structure

```
.
├── client/               # React frontend
│   └── vite-project/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Chat.jsx
│       │   │   └── Login.jsx
│       │   ├── App.jsx
│       │   └── main.jsx
│       └── package.json
└── server/              # Node.js backend
    ├── src/
    │   └── index.js
    └── package.json
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client/vite-project
npm install
```

3. Make sure Redis server is running on your machine

## Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client:
```bash
cd client/vite-project
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Environment Variables

### Server
Create a `.env` file in the server directory with the following variables:
```
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Client
The client uses the following default values:
- Server URL: `http://localhost:3000`

## Usage

1. Enter your username and a room name
2. Start chatting!
3. You can create new rooms by entering a new room name
4. See who's online in the current room
5. See when others are typing
6. View message history when joining a room 