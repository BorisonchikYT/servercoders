// ─── Redis подключается ЛЕНИВО, чтобы падение импорта не роняло всю функцию ───

let _Redis = null;
let _redisInstance = null;
let _redisInit = false;

function getRedis() {
  if (_redisInit) return _redisInstance;
  _redisInit = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log('[redis] env vars missing, rate limit disabled');
    _redisInstance = null;
    return null;
  }

  try {
    if (!_Redis) {
      _Redis = require('@upstash/redis').Redis;
    }
    _redisInstance = new _Redis({ url, token });
    console.log('[redis] connected');
    return _redisInstance;
  } catch (err) {
    console.log('[redis] init failed:', err.message);
    _redisInstance = null;
    return null;
  }
}

async function checkRateLimit(ip, limit = 30) {
  const r = getRedis();
  if (!r) return true;
  try {
    const key = `rl:${ip}`;
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, 60);
    return count <= limit;
  } catch (err) {
    console.log('[redis] rate limit error:', err.message);
    return true;
  }
}

function getIp(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['x-real-ip']
    || 'unknown';
}

module.exports = { getRedis, checkRateLimit, getIp };