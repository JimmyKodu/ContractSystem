// 合同数据模型
const { v4: uuidv4 } = require('uuid');

/**
 * 合同状态枚举
 */
const ContractStatus = {
  DRAFT: 'draft',                    // 草稿
  PENDING_SALES_MANAGER: 'pending_sales_manager',  // 待销售经理审批
  PENDING_SALES_DIRECTOR: 'pending_sales_director', // 待销售总监审批
  PENDING_LEGAL: 'pending_legal',    // 待法务审核
  PENDING_SEAL: 'pending_seal',      // 待落章
  APPROVED: 'approved',              // 已批准
  REJECTED: 'rejected',              // 已拒绝
  SEALED: 'sealed'                   // 已落章
};

/**
 * 合同类型枚举
 */
const ContractType = {
  OWN_TEMPLATE: 'own_template',      // 我方模板
  CUSTOMER_TEMPLATE: 'customer_template'  // 客户模板
};

/**
 * 审批记录类型
 */
const ApprovalType = {
  SUBMIT: 'submit',           // 提交
  APPROVE: 'approve',         // 批准
  REJECT: 'reject',           // 拒绝
  LEGAL_REVIEW: 'legal_review', // 法务审核
  SEAL: 'seal'                // 落章
};

/**
 * 创建新合同
 */
function createContract(data) {
  return {
    id: uuidv4(),
    contractNumber: generateContractNumber(),
    title: data.title,
    type: data.type || ContractType.OWN_TEMPLATE,
    customerId: data.customerId,
    customerName: data.customerName,
    amount: data.amount || 0,
    content: data.content || '',
    status: ContractStatus.DRAFT,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    needsLegalReview: data.type === ContractType.CUSTOMER_TEMPLATE,
    originalFileUrl: data.originalFileUrl || null,
    finalFileUrl: null,
    approvalRecords: [],
    signaturePositions: []
  };
}

/**
 * 生成合同编号
 */
function generateContractNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HT-${year}${month}${day}-${random}`;
}

/**
 * 创建审批记录
 */
function createApprovalRecord(data) {
  return {
    id: uuidv4(),
    contractId: data.contractId,
    type: data.type,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    comment: data.comment || '',
    signatureImageUrl: data.signatureImageUrl || null,
    signaturePosition: data.signaturePosition || null,
    timestamp: new Date().toISOString()
  };
}

/**
 * 签字位置信息
 */
function createSignaturePosition(data) {
  return {
    id: uuidv4(),
    userId: data.userId,
    userName: data.userName,
    pageNumber: data.pageNumber || 1,
    x: data.x,
    y: data.y,
    width: data.width || 150,
    height: data.height || 60,
    signatureImageUrl: data.signatureImageUrl || null,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  ContractStatus,
  ContractType,
  ApprovalType,
  createContract,
  generateContractNumber,
  createApprovalRecord,
  createSignaturePosition
};
