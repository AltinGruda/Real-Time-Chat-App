import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store active users and their rooms
const users = new Map();
const rooms = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('join', async ({ username, room }) => {
    // Store user information
    users.set(socket.id, { username, room });
    
    // Join the room
    socket.join(room);
    
    // Add user to room's user list
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);

    // Get last 10 messages from Redis
    const messages = await redis.lrange(`messages:${room}`, 0, 9);
    const parsedMessages = messages.map(msg => JSON.parse(msg));
    
    // Send welcome message and history
    socket.emit('message', {
      type: 'info',
      content: `Welcome to ${room}!`,
      timestamp: new Date(),
    });
    
    socket.emit('messageHistory', parsedMessages.reverse());

    // Broadcast user joined message
    socket.to(room).emit('message', {
      type: 'info',
      content: `${username} has joined the room`,
      timestamp: new Date(),
    });

    // Update user list for all clients in the room
    const roomUsers = Array.from(rooms.get(room))
      .map(id => ({ id, username: users.get(id)?.username }));
    io.to(room).emit('roomUsers', roomUsers);
  });

  // Handle chat messages
  socket.on('chatMessage', async (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageData = {
      user: user.username,
      content: message,
      timestamp: new Date(),
      type: 'message',
    };

    // Store message in Redis
    await redis.lpush(
      `messages:${user.room}`,
      JSON.stringify(messageData)
    );
    await redis.ltrim(`messages:${user.room}`, 0, 99); // Keep only last 100 messages

    // Broadcast message to room
    io.to(user.room).emit('message', messageData);
  });

  // Handle typing status
  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(user.room).emit('userTyping', {
      username: user.username,
      isTyping,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    // Remove user from room and users list
    rooms.get(user.room)?.delete(socket.id);
    if (rooms.get(user.room)?.size === 0) {
      rooms.delete(user.room);
    }
    users.delete(socket.id);

    // Broadcast user left message
    io.to(user.room).emit('message', {
      type: 'info',
      content: `${user.username} has left the room`,
      timestamp: new Date(),
    });

    // Update user list
    const roomUsers = Array.from(rooms.get(user.room) || [])
      .map(id => ({ id, username: users.get(id)?.username }));
    io.to(user.room).emit('roomUsers', roomUsers);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 