# Real-Time Chat Application

A feature-rich real-time chat application built with Node.js, Express, Socket.IO, and Redis. The application supports both group chat rooms and private messaging, with additional features like video calls and message persistence options.

## Features

### Chat Functionality
- **Group Chat Rooms**
  - Join/leave chat rooms
  - Real-time messaging in rooms
  - View room participants
  - Message history for rooms
  - Typing indicators

- **Private Messaging**
  - One-on-one private conversations
  - Message persistence options (temporary or permanent)
  - Private typing indicators
  - Customizable storage preferences

### Video Calls
- One-on-one video calls using WebRTC
- Call accept/reject functionality
- Call end functionality

### Data Persistence
- Redis-based message storage
- Configurable message retention
- User preferences storage
- Support for both temporary and permanent message storage

## Project Structure

### Backend
```
src/
├── config/
│   ├── environment.js   # Environment configuration
│   └── redis.js        # Redis client setup
├── services/
│   ├── messageService.js # Message handling and storage
│   ├── roomService.js   # Room management
│   └── userService.js   # User management and preferences
├── sockets/
│   ├── handlers/
│   │   ├── chatHandler.js  # Chat event handlers
│   │   ├── callHandler.js  # Video call handlers
│   │   └── roomHandler.js  # Room event handlers
│   └── socketManager.js    # Socket.IO initialization
├── utils/
│   └── chatUtils.js    # Utility functions
└── server.js           # Main application entry
```

### Frontend
```
client/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInput.jsx       # Message input component
│   │   │   ├── ChatMessages.jsx    # Messages display
│   │   │   └── ChatRoom.jsx        # Main chat component
│   │   ├── VideoCall/
│   │   │   ├── CallControls.jsx    # Call control buttons
│   │   │   └── VideoChat.jsx       # Video call component
│   │   └── Common/
│   │       ├── UserList.jsx        # Online users list
│   │       └── Header.jsx          # App header
│   ├── hooks/
│   │   ├── useSocket.js            # Socket.IO hooks
│   │   └── useVideoCall.js         # WebRTC hooks
│   ├── context/
│   │   ├── SocketContext.jsx       # Socket context
│   │   └── UserContext.jsx         # User context
│   ├── utils/
│   │   └── chatUtils.js            # Utility functions
│   ├── App.jsx                     # Main app component
│   └── main.jsx                    # Entry point
├── public/
│   └── assets/                     # Static assets
└── index.html                      # HTML template
```

## Setup

### Backend Setup
1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
- `PORT`: Server port (default: 3000)
- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `CLIENT_URL`: Client application URL (default: http://localhost:5173)

```

3. Start Redis server

4. Start the backend:
```bash
npm start
```

### Frontend Setup
1. Install dependencies:
```bash
cd client
npm install
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## WebSocket Events

### Room Events
- `join`: Join a chat room
- `disconnect`: Handle user disconnection

### Chat Events
- `chatMessage`: Send message to room
- `private-message`: Send private message
- `typing`: Broadcast typing status
- `private-typing`: Send private typing status

### Call Events
- `call-user`: Initiate video call
- `answer-call`: Accept incoming call
- `end-call`: End active call
- `reject-call`: Reject incoming call

### Storage Events
- `set-storage-preference`: Set message storage preference
- `get-storage-preference`: Get current storage preference

## Data Storage

### Redis Data Structure
- Room messages: `messages:{roomId}`
- Temporary private chats: `temp_chat:{user1Id}:{user2Id}`
- Permanent private chats: `permanent_chat:{username1}:{username2}`
- User preferences: `storage_preferences`



## License

This project is licensed under the MIT License - see the LICENSE file for details 