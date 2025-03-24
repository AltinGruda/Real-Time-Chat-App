import Redis from 'ioredis';
import { config } from './environment.js';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
}); 