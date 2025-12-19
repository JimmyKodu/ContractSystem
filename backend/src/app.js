// H5合同系统后端API主入口
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { initDatabase, initMockData } = require('./models/database');
const contractRoutes = require('./routes/contracts');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/contracts', contractRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'H5合同系统API运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 初始化数据库和启动服务器
function startServer() {
  try {
    // 初始化数据库
    initDatabase();
    console.log('数据库初始化完成');
    
    // 初始化模拟数据
    initMockData();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`H5合同系统API服务器运行在 http://localhost:${PORT}`);
      console.log('可用路由:');
      console.log('  GET  /api/health - 健康检查');
      console.log('  POST /api/users/login - 用户登录');
      console.log('  GET  /api/users - 获取用户列表');
      console.log('  GET  /api/customers - 获取客户列表');
      console.log('  GET  /api/contracts - 获取合同列表');
      console.log('  POST /api/contracts - 创建合同');
      console.log('  POST /api/contracts/:id/submit - 提交合同审批');
      console.log('  POST /api/contracts/:id/approve - 审批合同');
      console.log('  POST /api/contracts/:id/reject - 拒绝合同');
      console.log('  POST /api/contracts/:id/upload - 上传合同文件');
      console.log('  POST /api/contracts/:id/compare - 比较合同文件（防篡改）');
      console.log('  POST /api/contracts/:id/generate-final - 生成最终合同文件');
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
