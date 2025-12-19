// 数据库初始化和模拟数据
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../database/contract_system.db');

let db = null;

/**
 * 初始化数据库
 */
function initDatabase() {
  db = new Database(dbPath);
  
  // 创建公司表
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      address TEXT,
      legal_representative TEXT,
      phone TEXT,
      email TEXT,
      seal_image_url TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  // 创建部门表
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      company_id TEXT,
      parent_id TEXT,
      manager_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department_id TEXT,
      department_name TEXT,
      email TEXT,
      phone TEXT,
      signature_image_url TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    )
  `);

  // 创建客户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      salesperson_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    )
  `);

  // 创建合同表
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      contract_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      amount REAL DEFAULT 0,
      content TEXT,
      status TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_by_name TEXT,
      created_at TEXT,
      updated_at TEXT,
      needs_legal_review INTEGER DEFAULT 0,
      original_file_url TEXT,
      final_file_url TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 创建审批记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS approval_records (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      user_role TEXT,
      comment TEXT,
      signature_image_url TEXT,
      signature_position TEXT,
      timestamp TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建签字位置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS signature_positions (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      page_number INTEGER DEFAULT 1,
      x REAL,
      y REAL,
      width REAL DEFAULT 150,
      height REAL DEFAULT 60,
      signature_image_url TEXT,
      timestamp TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建合同文件表（用于存储上传的文件信息）
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_files (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_url TEXT,
      file_hash TEXT,
      ocr_text TEXT,
      created_at TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
  `);

  return db;
}

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

/**
 * 初始化模拟数据
 */
function initMockData() {
  const database = getDatabase();

  // 检查是否已有数据
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('数据库已有数据，跳过初始化');
    return;
  }

  const now = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync('123456', 10);

  // 创建公司
  const companyId = uuidv4();
  database.prepare(`
    INSERT INTO companies (id, name, code, address, legal_representative, phone, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(companyId, '示例科技有限公司', 'DEMO001', '北京市朝阳区建国路88号', '张总', '010-12345678', 'contact@demo.com', now, now);

  // 创建部门
  const salesDeptId = uuidv4();
  const legalDeptId = uuidv4();
  database.prepare(`
    INSERT INTO departments (id, name, code, company_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(salesDeptId, '销售部', 'SALES', companyId, now, now);
  database.prepare(`
    INSERT INTO departments (id, name, code, company_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(legalDeptId, '法务部', 'LEGAL', companyId, now, now);

  // 创建用户
  const users = [
    { id: uuidv4(), username: 'salesperson1', name: '李销售', role: 'salesperson', deptId: salesDeptId, deptName: '销售部' },
    { id: uuidv4(), username: 'salesmanager1', name: '王经理', role: 'sales_manager', deptId: salesDeptId, deptName: '销售部' },
    { id: uuidv4(), username: 'salesdirector1', name: '赵总监', role: 'sales_director', deptId: salesDeptId, deptName: '销售部' },
    { id: uuidv4(), username: 'legal1', name: '钱法务', role: 'legal_staff', deptId: legalDeptId, deptName: '法务部' },
    { id: uuidv4(), username: 'sealkeeper1', name: '孙印章', role: 'seal_keeper', deptId: salesDeptId, deptName: '销售部' },
    { id: uuidv4(), username: 'admin', name: '管理员', role: 'admin', deptId: salesDeptId, deptName: '销售部' }
  ];

  const insertUser = database.prepare(`
    INSERT INTO users (id, username, password, name, role, department_id, department_name, created_at, updated_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const user of users) {
    insertUser.run(user.id, user.username, hashedPassword, user.name, user.role, user.deptId, user.deptName, now, now);
  }

  // 创建客户
  const customers = [
    { id: uuidv4(), name: '客户A公司', code: 'CUST001', contactPerson: '张先生', phone: '13800138001', salespersonId: users[0].id },
    { id: uuidv4(), name: '客户B公司', code: 'CUST002', contactPerson: '李女士', phone: '13800138002', salespersonId: users[0].id }
  ];

  const insertCustomer = database.prepare(`
    INSERT INTO customers (id, name, code, contact_person, phone, salesperson_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const customer of customers) {
    insertCustomer.run(customer.id, customer.name, customer.code, customer.contactPerson, customer.phone, customer.salespersonId, now, now);
  }

  console.log('模拟数据初始化完成');
}

module.exports = {
  initDatabase,
  getDatabase,
  initMockData
};
