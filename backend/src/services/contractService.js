// 合同服务
const { getDatabase } = require('../models/database');
const { ContractStatus, ContractType, ApprovalType, generateContractNumber } = require('../models/Contract');
const { v4: uuidv4 } = require('uuid');

/**
 * 创建合同
 */
function createContract(data) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = uuidv4();
  const contractNumber = generateContractNumber();
  const needsLegalReview = data.type === ContractType.CUSTOMER_TEMPLATE ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO contracts (
      id, contract_number, title, type, customer_id, customer_name, amount, content,
      status, created_by, created_by_name, created_at, updated_at, needs_legal_review, original_file_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    contractNumber,
    data.title,
    data.type || ContractType.OWN_TEMPLATE,
    data.customerId,
    data.customerName,
    data.amount || 0,
    data.content || '',
    ContractStatus.DRAFT,
    data.createdBy,
    data.createdByName,
    now,
    now,
    needsLegalReview,
    data.originalFileUrl || null
  );

  return getContractById(id);
}

/**
 * 根据ID获取合同
 */
function getContractById(id) {
  const db = getDatabase();
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  if (contract) {
    contract.approvalRecords = getApprovalRecords(id);
    contract.signaturePositions = getSignaturePositions(id);
    contract.files = getContractFiles(id);
  }
  return contract;
}

/**
 * 获取合同列表
 */
function getContracts(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM contracts WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.createdBy) {
    sql += ' AND created_by = ?';
    params.push(filters.createdBy);
  }
  if (filters.customerId) {
    sql += ' AND customer_id = ?';
    params.push(filters.customerId);
  }

  sql += ' ORDER BY created_at DESC';

  const contracts = db.prepare(sql).all(...params);
  return contracts.map(contract => {
    contract.approvalRecords = getApprovalRecords(contract.id);
    return contract;
  });
}

/**
 * 获取待审批合同列表
 */
function getPendingContracts(userRole) {
  const db = getDatabase();
  let statusCondition = '';

  switch (userRole) {
    case 'sales_manager':
      statusCondition = `status = '${ContractStatus.PENDING_SALES_MANAGER}'`;
      break;
    case 'sales_director':
      statusCondition = `status = '${ContractStatus.PENDING_SALES_DIRECTOR}'`;
      break;
    case 'legal_staff':
      statusCondition = `status = '${ContractStatus.PENDING_LEGAL}'`;
      break;
    case 'seal_keeper':
      statusCondition = `status = '${ContractStatus.PENDING_SEAL}'`;
      break;
    default:
      return [];
  }

  const sql = `SELECT * FROM contracts WHERE ${statusCondition} ORDER BY created_at DESC`;
  const contracts = db.prepare(sql).all();
  return contracts.map(contract => {
    contract.approvalRecords = getApprovalRecords(contract.id);
    return contract;
  });
}

/**
 * 提交合同审批
 */
function submitContract(contractId, userId, userName, userRole, signatureImageUrl, signaturePosition) {
  const db = getDatabase();
  const contract = getContractById(contractId);
  
  if (!contract) {
    throw new Error('合同不存在');
  }

  if (contract.status !== ContractStatus.DRAFT) {
    throw new Error('只有草稿状态的合同才能提交');
  }

  const now = new Date().toISOString();
  
  // 添加提交审批记录
  const recordId = uuidv4();
  db.prepare(`
    INSERT INTO approval_records (id, contract_id, type, user_id, user_name, user_role, comment, signature_image_url, signature_position, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(recordId, contractId, ApprovalType.SUBMIT, userId, userName, userRole, '提交审批', signatureImageUrl || null, JSON.stringify(signaturePosition) || null, now);

  // 如果有签字位置信息，保存签字位置
  if (signaturePosition && signatureImageUrl) {
    saveSignaturePosition(contractId, userId, userName, signaturePosition, signatureImageUrl);
  }

  // 更新合同状态为待销售经理审批
  db.prepare(`
    UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?
  `).run(ContractStatus.PENDING_SALES_MANAGER, now, contractId);

  return getContractById(contractId);
}

/**
 * 审批合同
 */
function approveContract(contractId, userId, userName, userRole, comment, signatureImageUrl, signaturePosition) {
  const db = getDatabase();
  const contract = getContractById(contractId);
  
  if (!contract) {
    throw new Error('合同不存在');
  }

  const now = new Date().toISOString();
  let newStatus;
  let approvalType = ApprovalType.APPROVE;

  // 根据当前状态和用户角色确定下一个状态
  switch (contract.status) {
    case ContractStatus.PENDING_SALES_MANAGER:
      if (userRole !== 'sales_manager') {
        throw new Error('只有销售经理才能审批此合同');
      }
      newStatus = ContractStatus.PENDING_SALES_DIRECTOR;
      break;
    case ContractStatus.PENDING_SALES_DIRECTOR:
      if (userRole !== 'sales_director') {
        throw new Error('只有销售总监才能审批此合同');
      }
      // 如果需要法务审核，转到法务；否则直接到落章
      if (contract.needs_legal_review) {
        newStatus = ContractStatus.PENDING_LEGAL;
      } else {
        newStatus = ContractStatus.PENDING_SEAL;
      }
      break;
    case ContractStatus.PENDING_LEGAL:
      if (userRole !== 'legal_staff') {
        throw new Error('只有法务人员才能审批此合同');
      }
      approvalType = ApprovalType.LEGAL_REVIEW;
      newStatus = ContractStatus.PENDING_SEAL;
      break;
    case ContractStatus.PENDING_SEAL:
      if (userRole !== 'seal_keeper') {
        throw new Error('只有落章人员才能落章');
      }
      approvalType = ApprovalType.SEAL;
      newStatus = ContractStatus.SEALED;
      break;
    default:
      throw new Error('合同当前状态不允许审批');
  }

  // 添加审批记录
  const recordId = uuidv4();
  db.prepare(`
    INSERT INTO approval_records (id, contract_id, type, user_id, user_name, user_role, comment, signature_image_url, signature_position, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(recordId, contractId, approvalType, userId, userName, userRole, comment || '', signatureImageUrl || null, JSON.stringify(signaturePosition) || null, now);

  // 如果有签字位置信息，保存签字位置
  if (signaturePosition && signatureImageUrl) {
    saveSignaturePosition(contractId, userId, userName, signaturePosition, signatureImageUrl);
  }

  // 更新合同状态
  db.prepare(`
    UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?
  `).run(newStatus, now, contractId);

  return getContractById(contractId);
}

/**
 * 拒绝合同
 */
function rejectContract(contractId, userId, userName, userRole, comment) {
  const db = getDatabase();
  const contract = getContractById(contractId);
  
  if (!contract) {
    throw new Error('合同不存在');
  }

  const now = new Date().toISOString();

  // 添加拒绝记录
  const recordId = uuidv4();
  db.prepare(`
    INSERT INTO approval_records (id, contract_id, type, user_id, user_name, user_role, comment, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(recordId, contractId, ApprovalType.REJECT, userId, userName, userRole, comment || '审批拒绝', now);

  // 更新合同状态为拒绝
  db.prepare(`
    UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?
  `).run(ContractStatus.REJECTED, now, contractId);

  return getContractById(contractId);
}

/**
 * 获取审批记录
 */
function getApprovalRecords(contractId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM approval_records WHERE contract_id = ? ORDER BY timestamp ASC').all(contractId);
}

/**
 * 获取签字位置
 */
function getSignaturePositions(contractId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM signature_positions WHERE contract_id = ? ORDER BY timestamp ASC').all(contractId);
}

/**
 * 保存签字位置
 */
function saveSignaturePosition(contractId, userId, userName, position, signatureImageUrl) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO signature_positions (id, contract_id, user_id, user_name, page_number, x, y, width, height, signature_image_url, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    contractId,
    userId,
    userName,
    position.pageNumber || 1,
    position.x,
    position.y,
    position.width || 150,
    position.height || 60,
    signatureImageUrl,
    now
  );

  return id;
}

/**
 * 保存合同文件
 */
function saveContractFile(contractId, fileName, fileType, fileUrl, fileHash, ocrText) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO contract_files (id, contract_id, file_name, file_type, file_url, file_hash, ocr_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, contractId, fileName, fileType, fileUrl, fileHash, ocrText, now);

  return id;
}

/**
 * 获取合同文件
 */
function getContractFiles(contractId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM contract_files WHERE contract_id = ? ORDER BY created_at ASC').all(contractId);
}

/**
 * 更新合同最终文件URL
 */
function updateFinalFileUrl(contractId, fileUrl) {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE contracts SET final_file_url = ?, updated_at = ? WHERE id = ?
  `).run(fileUrl, now, contractId);
}

module.exports = {
  createContract,
  getContractById,
  getContracts,
  getPendingContracts,
  submitContract,
  approveContract,
  rejectContract,
  getApprovalRecords,
  getSignaturePositions,
  saveSignaturePosition,
  saveContractFile,
  getContractFiles,
  updateFinalFileUrl
};
