// 简单的速率限制中间件
const rateLimitMap = new Map();

/**
 * 创建速率限制中间件
 * @param {Object} options - 配置选项
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {number} options.max - 最大请求数
 * @param {string} options.message - 超限时的错误消息
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000; // 默认1分钟
  const max = options.max || 100; // 默认最大100次请求
  const message = options.message || '请求过于频繁，请稍后再试';

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const record = rateLimitMap.get(key);
    
    // 检查是否需要重置
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    // 增加计数
    record.count++;
    
    // 检查是否超过限制
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message: message
      });
    }
    
    next();
  };
}

// 清理过期记录（每5分钟执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime + 300000) { // 5分钟后清理
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// 预定义的限制器
const loginLimiter = createRateLimiter({
  windowMs: 60000, // 1分钟
  max: 5, // 最多5次登录尝试
  message: '登录尝试过于频繁，请1分钟后再试'
});

const apiLimiter = createRateLimiter({
  windowMs: 60000, // 1分钟
  max: 100, // 最多100次API请求
  message: 'API请求过于频繁，请稍后再试'
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  apiLimiter
};
