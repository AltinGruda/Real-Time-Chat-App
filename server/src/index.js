import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Redis from 'ioredis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const users = new Map();
const rooms = new Map();

const getPrivateChatId = (user1Id, user2Id) => {
  return [user1Id, user2Id].sort().join(':');
};

const getPermanentChatId = (username1, username2) => {
  return ['permanent', username1, username2].sort().slice(1).join(':');
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('set-storage-preference', async ({ isPermanent }) => {
    const user = users.get(socket.id);
    if (!user) return;

    await redis.hset('storage_preferences', user.username, isPermanent ? '1' : '0');
  });

  socket.on('get-storage-preference', async () => {
    const user = users.get(socket.id);
    if (!user) return;

    const preference = await redis.hget('storage_preferences', user.username);
    socket.emit('storage-preference', { isPermanent: preference === '1' });
  });

  socket.on('join', async ({ username, room }) => {
    users.set(socket.id, { username, room });
    
    socket.join(room);
    
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);

    const messages = await redis.lrange(`messages:${room}`, 0, 9);
    const parsedMessages = messages.map(msg => JSON.parse(msg));
    
    socket.emit('message', {
      type: 'info',
      content: `Welcome to ${room}!`,
      timestamp: new Date(),
    });
    
    socket.emit('messageHistory', parsedMessages.reverse());

    socket.to(room).emit('message', {
      type: 'info',
      content: `${username} has joined the room`,
      timestamp: new Date(),
    });

    const roomUsers = Array.from(rooms.get(room))
      .map(id => ({ id, username: users.get(id)?.username }));
    io.to(room).emit('roomUsers', roomUsers);
  });

  socket.on('chatMessage', async (message) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageData = {
      user: user.username,
      content: message,
      timestamp: new Date(),
      type: 'message',
    };

    await redis.lpush(
      `messages:${user.room}`,
      JSON.stringify(messageData)
    );
    await redis.ltrim(`messages:${user.room}`, 0, 99); 

    io.to(user.room).emit('message', messageData);
  });

  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(user.room).emit('userTyping', {
      username: user.username,
      isTyping,
    });
  });

  socket.on('call-user', ({ userToCall, signalData }) => {
    const caller = users.get(socket.id);
    if (!caller) return;

    console.log(`Call request from ${caller.username} to user ID: ${userToCall}`);
    
    io.to(userToCall).emit('incoming-call', {
      signal: signalData,
      from: socket.id,
      callerName: caller.username
    });
  });

  socket.on('answer-call', ({ to, signal }) => {
    const answerer = users.get(socket.id);
    if (!answerer) return;

    console.log(`Call answered by ${answerer.username} to user ID: ${to}`);
    io.to(to).emit('call-accepted', signal);
  });

  socket.on('end-call', ({ to }) => {
    const caller = users.get(socket.id);
    if (!caller) return;

    console.log(`Call ended by ${caller.username} to user ID: ${to}`);
    io.to(to).emit('call-ended');
  });

  socket.on('reject-call', ({ to }) => {
    const rejector = users.get(socket.id);
    if (!rejector) return;

    console.log(`Call rejected by ${rejector.username} to user ID: ${to}`);
    io.to(to).emit('call-rejected');
  });

  socket.on('private-message', async ({ to, content }) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    const receiver = users.get(to);
    if (!receiver) return;

    const messageData = {
      from: sender.username,
      to: receiver.username,
      content,
      timestamp: new Date(),
    };

    const senderPreference = await redis.hget('storage_preferences', sender.username);
    const isPermanent = senderPreference === '1';

    if (isPermanent) {
      const permanentChatId = getPermanentChatId(sender.username, receiver.username);
      await redis.lpush(
        `permanent_chat:${permanentChatId}`,
        JSON.stringify(messageData)
      );
      await redis.ltrim(`permanent_chat:${permanentChatId}`, 0, 99);
    } else {
      const tempChatId = getPrivateChatId(socket.id, to);
      await redis.lpush(
        `temp_chat:${tempChatId}`,
        JSON.stringify(messageData)
      );
      await redis.ltrim(`temp_chat:${tempChatId}`, 0, 99);
    }

    io.to(to).emit('private-message', messageData);
    socket.emit('private-message', messageData);
  });

  socket.on('get-private-history', async ({ otherUserId }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const otherUser = users.get(otherUserId);
    if (!otherUser) return;

    const preference = await redis.hget('storage_preferences', user.username);
    const isPermanent = preference === '1';

    let messages = [];
    if (isPermanent) {
      const permanentChatId = getPermanentChatId(user.username, otherUser.username);
      messages = await redis.lrange(`permanent_chat:${permanentChatId}`, 0, 49);
    } else {
      const tempChatId = getPrivateChatId(socket.id, otherUserId);
      messages = await redis.lrange(`temp_chat:${tempChatId}`, 0, 49);
    }

    const parsedMessages = messages.map(msg => JSON.parse(msg));
    socket.emit('private-message-history', parsedMessages.reverse());
  });

  socket.on('private-typing', ({ to, isTyping }) => {
    const user = users.get(socket.id);
    if (!user) return;

    io.to(to).emit('private-typing', {
      username: user.username,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    rooms.get(user.room)?.delete(socket.id);
    if (rooms.get(user.room)?.size === 0) {
      rooms.delete(user.room);
    }
    users.delete(socket.id);

    io.to(user.room).emit('message', {
      type: 'info',
      content: `${user.username} has left the room`,
      timestamp: new Date(),
    });

    const roomUsers = Array.from(rooms.get(user.room) || [])
      .map(id => ({ id, username: users.get(id)?.username }));
    io.to(user.room).emit('roomUsers', roomUsers);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 