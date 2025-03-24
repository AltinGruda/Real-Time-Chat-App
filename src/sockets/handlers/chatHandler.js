import { MessageService } from '../../services/messageService.js';

export class ChatHandler {
  constructor(io, socket, userService, roomService) {
    this.io = io;
    this.socket = socket;
    this.userService = userService;
    this.roomService = roomService;
    this.messageService = new MessageService();
  }

  handleChatMessage = async (message) => {
    const user = this.userService.getUser(this.socket.id);
    if (!user) return;

    const messageData = {
      user: user.username,
      content: message,
      timestamp: new Date(),
      type: 'message',
    };

    await this.messageService.storeMessage(user.room, messageData);
    this.io.to(user.room).emit('message', messageData);
  }

  handlePrivateMessage = async ({ to, content }) => {
    const sender = this.userService.getUser(this.socket.id);
    if (!sender) return;

    const receiver = this.userService.getUser(to);
    if (!receiver) return;

    const messageData = {
      from: sender.username,
      to: receiver.username,
      content,
      timestamp: new Date(),
    };

    const isPermanent = await this.userService.getStoragePreference(sender.username);
    await this.messageService.storePrivateMessage(
      { id: this.socket.id, username: sender.username },
      { id: to, username: receiver.username },
      messageData,
      isPermanent
    );

    this.io.to(to).emit('private-message', messageData);
    this.socket.emit('private-message', messageData);
  }
  handlePrivateHistory = async ({ otherUserId }) => {
    console.log("Registering socket event: get-private-history");

    const user = this.userService.getUser(this.socket.id);
    if (!user) {
        console.error(`[handlePrivateHistory] User not found for socket ID: ${this.socket.id}`);
        return;
    }

    const otherUser = this.userService.getUser(otherUserId);
    if (!otherUser) {
        console.error(`[handlePrivateHistory] Other user not found for ID: ${otherUserId}`);
        return;
    }

    const isPermanent = await this.userService.getStoragePreference(user.username);
    console.log(`[handlePrivateHistory] Storage preference for ${user.username}:`, isPermanent);

    const messages = await this.messageService.getPrivateMessageHistory(
      { id: this.socket.id, username: user.username },
      { id: otherUserId, username: otherUser.username },
      isPermanent
    );

    console.log(`[handlePrivateHistory] Retrieved messages:`, messages);

    this.socket.emit('private-message-history', messages);
};
  handleTyping = (isTyping) => {
    const user = this.userService.getUser(this.socket.id);
    if (!user) return;

    this.socket.to(user.room).emit('userTyping', {
      username: user.username,
      isTyping,
    });
  }

  handlePrivateTyping = ({ to, isTyping }) => {
    const user = this.userService.getUser(this.socket.id);
    if (!user) return;

    this.io.to(to).emit('private-typing', {
      username: user.username,
      isTyping,
    });
  }
} 