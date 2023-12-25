import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis.ts';

const QUOTA = Number(process.env.RATE_LIMITER_QUOTA) || 600;
const WINDOW = Number(process.env.RATE_LIMITER_WINDOW) || 10;

async function isExcessQuota(token: string) {
  const results = await redisClient
    .multi()
    .set(token, 0, {
      EX: WINDOW,
      NX: true,
    })
    .incr(token)
    .exec();
  if (!results) return false;
  if (!Array.isArray(results[1])) return false;
  const count = results[1][1];
  return (typeof count === 'number' && count > QUOTA) || false;
}

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.ip || req.socket.remoteAddress;
    const ip = Array.isArray(token) ? token[0] : token;
    if (!ip) {
      next();
      return;
    }

    if (await isExcessQuota(ip)) {
      res.status(429).send(`Quota of ${QUOTA} per ${WINDOW} sec exceeded`);
      return;
    }
    next();
  } catch (error) {
    console.error(error);
    next();
  }
};

export default rateLimiter;
