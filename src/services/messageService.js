import { redis } from '../config/redis.js';
import { getPrivateChatId, getPermanentChatId } from '../utils/chatUtils.js';

export class MessageService {
  static async storeMessage(room, messageData) {
    await redis.lpush(`messages:${room}`, JSON.stringify(messageData));
    await redis.ltrim(`messages:${room}`, 0, 99);
  }

  static async getMessageHistory(room) {
    const messages = await redis.lrange(`messages:${room}`, 0, 9);
    return messages.map(msg => JSON.parse(msg)).reverse();
  }

  static async storePrivateMessage(sender, receiver, messageData, isPermanent) {
    const chatId = isPermanent
      ? getPermanentChatId(sender.username, receiver.username)
      : getPrivateChatId(sender.id, receiver.id);
    
    const prefix = isPermanent ? 'permanent_chat' : 'temp_chat';
    await redis.lpush(`${prefix}:${chatId}`, JSON.stringify(messageData));
    await redis.ltrim(`${prefix}:${chatId}`, 0, 99);
  }

  static async getPrivateMessageHistory(user1, user2, isPermanent) {
    const chatId = isPermanent
      ? getPermanentChatId(user1.username, user2.username)
      : getPrivateChatId(user1.id, user2.id);
    
    const prefix = isPermanent ? 'permanent_chat' : 'temp_chat';
    const messages = await redis.lrange(`${prefix}:${chatId}`, 0, 49);
    return messages.map(msg => JSON.parse(msg)).reverse();
  }
}
