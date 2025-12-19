// 用户路由
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimit');

const JWT_SECRET = process.env.JWT_SECRET || 'contract-system-secret-key';

/**
 * 用户登录
 * POST /api/users/login
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDatabase();
    
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          departmentId: user.department_id,
          departmentName: user.department_name,
          signatureImageUrl: user.signature_image_url
        }
      },
      message: '登录成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/users/me
 */
router.get('/me', apiLimiter, async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        departmentId: user.department_id,
        departmentName: user.department_name,
        signatureImageUrl: user.signature_image_url
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '登录已过期'
    });
  }
});

/**
 * 获取用户列表
 * GET /api/users
 */
router.get('/', apiLimiter, async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.prepare('SELECT id, username, name, role, department_id, department_name FROM users WHERE is_active = 1').all();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 根据角色获取用户
 * GET /api/users/role/:role
 */
router.get('/role/:role', apiLimiter, async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.prepare('SELECT id, username, name, role, department_id, department_name FROM users WHERE role = ? AND is_active = 1').all(req.params.role);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 更新用户签名图片
 * PUT /api/users/:id/signature
 */
router.put('/:id/signature', apiLimiter, async (req, res) => {
  try {
    const { signatureImageUrl } = req.body;
    const db = getDatabase();
    const now = new Date().toISOString();
    
    db.prepare('UPDATE users SET signature_image_url = ?, updated_at = ? WHERE id = ?')
      .run(signatureImageUrl, now, req.params.id);
    
    res.json({
      success: true,
      message: '签名更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
