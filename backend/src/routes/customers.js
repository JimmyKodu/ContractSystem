// 客户路由
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 获取客户列表
 * GET /api/customers
 */
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取单个客户
 * GET /api/customers/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 创建客户
 * POST /api/customers
 */
router.post('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { name, code, contactPerson, phone, email, address, salespersonId } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO customers (id, name, code, contact_person, phone, email, address, salesperson_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code, contactPerson, phone, email, address, salespersonId, now, now);
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({
      success: true,
      data: customer,
      message: '客户创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 更新客户
 * PUT /api/customers/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const { name, code, contactPerson, phone, email, address } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE customers SET name = ?, code = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = ?
      WHERE id = ?
    `).run(name, code, contactPerson, phone, email, address, now, req.params.id);
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({
      success: true,
      data: customer,
      message: '客户更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
