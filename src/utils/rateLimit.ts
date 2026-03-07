import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const puzzleRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'rl_puzzle',
});

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'rl_auth',
});

export const actionRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'rl_action',
});
