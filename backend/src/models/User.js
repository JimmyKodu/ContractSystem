// 用户和组织数据模型
const { v4: uuidv4 } = require('uuid');

/**
 * 用户角色枚举
 */
const UserRole = {
  SALESPERSON: 'salesperson',           // 销售员
  SALES_MANAGER: 'sales_manager',       // 销售经理
  SALES_DIRECTOR: 'sales_director',     // 销售总监
  LEGAL_STAFF: 'legal_staff',           // 法务人员
  SEAL_KEEPER: 'seal_keeper',           // 落章人员
  ADMIN: 'admin'                        // 管理员
};

/**
 * 创建用户
 */
function createUser(data) {
  return {
    id: data.id || uuidv4(),
    username: data.username,
    password: data.password, // 实际使用时需要哈希处理
    name: data.name,
    role: data.role || UserRole.SALESPERSON,
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    email: data.email,
    phone: data.phone,
    signatureImageUrl: data.signatureImageUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };
}

/**
 * 创建公司
 */
function createCompany(data) {
  return {
    id: data.id || uuidv4(),
    name: data.name,
    code: data.code,
    address: data.address,
    legalRepresentative: data.legalRepresentative,
    phone: data.phone,
    email: data.email,
    sealImageUrl: data.sealImageUrl || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 创建部门
 */
function createDepartment(data) {
  return {
    id: data.id || uuidv4(),
    name: data.name,
    code: data.code,
    companyId: data.companyId,
    parentId: data.parentId || null,
    managerId: data.managerId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 创建客户
 */
function createCustomer(data) {
  return {
    id: data.id || uuidv4(),
    name: data.name,
    code: data.code,
    contactPerson: data.contactPerson,
    phone: data.phone,
    email: data.email,
    address: data.address,
    salespersonId: data.salespersonId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  UserRole,
  createUser,
  createCompany,
  createDepartment,
  createCustomer
};
