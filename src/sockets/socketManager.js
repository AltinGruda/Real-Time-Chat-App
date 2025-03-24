import { Server } from 'socket.io';
import { config } from '../config/environment.js';
import { UserService } from '../services/userService.js';
import { RoomService } from '../services/roomService.js';
import { ChatHandler } from './handlers/chatHandler.js';
import { CallHandler } from './handlers/callHandler.js';
import { RoomHandler } from './handlers/roomHandler.js';

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.client.url,
      methods: ['GET', 'POST'],
    },
  });

  const userService = new UserService();
  const roomService = new RoomService();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Initialize handlers
    const chatHandler = new ChatHandler(io, socket, userService, roomService);
    const callHandler = new CallHandler(io, socket, userService);
    const roomHandler = new RoomHandler(io, socket, userService, roomService);

    // Room events
    socket.on('join', roomHandler.handleJoin);
    socket.on('disconnect', roomHandler.handleDisconnect);

    // Chat events
    socket.on('chatMessage', chatHandler.handleChatMessage);
    socket.on('private-message', chatHandler.handlePrivateMessage);
    socket.on('get-private-history', chatHandler.handlePrivateHistory);
    socket.on('typing', chatHandler.handleTyping);
    socket.on('private-typing', chatHandler.handlePrivateTyping);

    // Call events
    socket.on('call-user', callHandler.handleCallUser);
    socket.on('answer-call', callHandler.handleAnswerCall);
    socket.on('end-call', callHandler.handleEndCall);
    socket.on('reject-call', callHandler.handleRejectCall);

    // Storage preference events
    socket.on('set-storage-preference', async ({ isPermanent }) => {
      const user = userService.getUser(socket.id);
      if (!user) return;
      await userService.setStoragePreference(user.username, isPermanent);
    });

    socket.on('get-storage-preference', async () => {
      const user = userService.getUser(socket.id);
      if (!user) return;
      const isPermanent = await userService.getStoragePreference(user.username);
      socket.emit('storage-preference', { isPermanent });
    });
  });

  return io;
}; 