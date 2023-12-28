// eslint-disable-next-line import/no-extraneous-dependencies
import { createClient } from 'redis';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@localhost:6379`,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect();
