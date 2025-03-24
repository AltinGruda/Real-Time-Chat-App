import { redis } from '../config/redis.js';

export class UserService {
  constructor() {
    this.users = new Map();
  }

  addUser(socketId, userData) {
    this.users.set(socketId, userData);
  }

  removeUser(socketId) {
    this.users.delete(socketId);
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  async setStoragePreference(username, isPermanent) {
    await redis.hset('storage_preferences', username, isPermanent ? '1' : '0');
  }

  async getStoragePreference(username) {
    const preference = await redis.hget('storage_preferences', username);
    return preference === '1';
  }
} 