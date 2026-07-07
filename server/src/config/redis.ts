import Redis from 'ioredis';
import { config } from './index';
let redis: Redis | null = null;
if (config.redis.url) {
  redis = new Redis(config.redis.url, { maxRetriesPerRequest: 3, retryStrategy(times) { if (times > 3) return null; return Math.min(times * 200, 2000); } });
  redis.on('error', (err) => { console.error('Redis connection error:', err); });
}
export { redis };
export default redis;
