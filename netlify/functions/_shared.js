const { Redis } = require('@upstash/redis');

function getRedis() {
  if (redis) return redis;
  // Проверяем, заданы ли переменные, чтобы не падать, если их нет
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  redis = Redis.fromEnv();
  return redis;
}