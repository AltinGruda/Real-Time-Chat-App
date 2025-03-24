export class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  addUserToRoom(roomId, socketId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(socketId);
  }

  removeUserFromRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  getRoomUsers(roomId) {
    return Array.from(this.rooms.get(roomId) || []);
  }

  getUserRooms(socketId) {
    const userRooms = [];
    for (const [roomId, users] of this.rooms.entries()) {
      if (users.has(socketId)) {
        userRooms.push(roomId);
      }
    }
    return userRooms;
  }
} 