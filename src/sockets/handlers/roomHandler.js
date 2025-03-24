import { MessageService } from '../../services/messageService.js';

export class RoomHandler {
  constructor(io, socket, userService, roomService) {
    this.io = io;
    this.socket = socket;
    this.userService = userService;
    this.roomService = roomService;
    this.messageService = new MessageService();
  }

  handleJoin = async ({ username, room }) => {
    const userData = { username, room };
    this.userService.addUser(this.socket.id, userData);
    
    this.socket.join(room);
    this.roomService.addUserToRoom(room, this.socket.id);

    const messages = await this.messageService.getMessageHistory(room);
    
    this.socket.emit('message', {
      type: 'info',
      content: `Welcome to ${room}!`,
      timestamp: new Date(),
    });
    
    this.socket.emit('messageHistory', messages);

    this.socket.to(room).emit('message', {
      type: 'info',
      content: `${username} has joined the room`,
      timestamp: new Date(),
    });

    this.updateRoomUsers(room);
  }

  handleDisconnect = () => {
    const user = this.userService.getUser(this.socket.id);
    if (!user) return;

    this.roomService.removeUserFromRoom(user.room, this.socket.id);
    this.userService.removeUser(this.socket.id);

    this.io.to(user.room).emit('message', {
      type: 'info',
      content: `${user.username} has left the room`,
      timestamp: new Date(),
    });

    this.updateRoomUsers(user.room);
  }

  updateRoomUsers = (room) => {
    const users = this.roomService.getRoomUsers(room)
      .map(id => {
        const user = this.userService.getUser(id);
        return { id, username: user?.username };
      });
    this.io.to(room).emit('roomUsers', users);
  }
} 