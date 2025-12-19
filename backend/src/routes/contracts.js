// 合同路由
const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const pdfService = require('../services/pdfService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

/**
 * 创建合同
 * POST /api/contracts
 */
router.post('/', async (req, res) => {
  try {
    const contract = contractService.createContract(req.body);
    res.status(201).json({
      success: true,
      data: contract,
      message: '合同创建成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取合同列表
 * GET /api/contracts
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      createdBy: req.query.createdBy,
      customerId: req.query.customerId
    };
    const contracts = contractService.getContracts(filters);
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取待审批合同列表
 * GET /api/contracts/pending/:role
 */
router.get('/pending/:role', async (req, res) => {
  try {
    const contracts = contractService.getPendingContracts(req.params.role);
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取单个合同
 * GET /api/contracts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }
    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 提交合同审批
 * POST /api/contracts/:id/submit
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const { userId, userName, userRole, signatureImageUrl, signaturePosition } = req.body;
    const contract = contractService.submitContract(
      req.params.id,
      userId,
      userName,
      userRole,
      signatureImageUrl,
      signaturePosition
    );
    res.json({
      success: true,
      data: contract,
      message: '合同已提交审批'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 审批合同
 * POST /api/contracts/:id/approve
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { userId, userName, userRole, comment, signatureImageUrl, signaturePosition } = req.body;
    const contract = contractService.approveContract(
      req.params.id,
      userId,
      userName,
      userRole,
      comment,
      signatureImageUrl,
      signaturePosition
    );
    res.json({
      success: true,
      data: contract,
      message: '审批通过'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 拒绝合同
 * POST /api/contracts/:id/reject
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const { userId, userName, userRole, comment } = req.body;
    const contract = contractService.rejectContract(
      req.params.id,
      userId,
      userName,
      userRole,
      comment
    );
    res.json({
      success: true,
      data: contract,
      message: '审批已拒绝'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 上传合同文件
 * POST /api/contracts/:id/upload
 */
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    const filePath = req.file.path;
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // 计算文件哈希
    const fileHash = await pdfService.calculateFileHash(filePath);
    
    // OCR提取文本（如果是PDF或图片）
    let ocrText = null;
    if (req.file.mimetype.includes('image') || req.file.mimetype.includes('pdf')) {
      try {
        ocrText = await pdfService.extractTextFromImage(filePath);
      } catch (e) {
        console.log('OCR提取失败，跳过:', e.message);
      }
    }
    
    const fileId = contractService.saveContractFile(
      req.params.id,
      req.file.originalname,
      req.file.mimetype,
      fileUrl,
      fileHash,
      ocrText
    );

    res.json({
      success: true,
      data: {
        fileId,
        fileUrl,
        fileName: req.file.originalname,
        fileHash
      },
      message: '文件上传成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 比较合同文件（防篡改检测）
 * POST /api/contracts/:id/compare
 */
router.post('/:id/compare', upload.single('returnedFile'), async (req, res) => {
  try {
    const contract = contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    if (!contract.files || contract.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '合同没有原始文件'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传客户回传的文件'
      });
    }

    const originalFile = contract.files[0];
    const originalPath = path.join(__dirname, '../../', originalFile.file_url);
    const returnedPath = req.file.path;

    const comparison = await pdfService.comparePdfFiles(originalPath, returnedPath);

    res.json({
      success: true,
      data: comparison,
      message: comparison.match ? '文件验证通过' : '检测到差异，请核查'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 生成最终合同文件（包含审批链）
 * POST /api/contracts/:id/generate-final
 */
router.post('/:id/generate-final', async (req, res) => {
  try {
    const contract = contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    if (!contract.files || contract.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '合同没有原始文件'
      });
    }

    const originalFile = contract.files[0];
    const originalPath = path.join(__dirname, '../../', originalFile.file_url);
    const outputFileName = `final-${Date.now()}-${path.basename(originalFile.file_url)}`;
    const outputPath = path.join(__dirname, '../../uploads', outputFileName);

    // 添加审批链到PDF
    await pdfService.addApprovalChainToPdf(
      originalPath,
      contract.approvalRecords,
      outputPath
    );

    const finalFileUrl = `/uploads/${outputFileName}`;
    contractService.updateFinalFileUrl(contract.id, finalFileUrl);

    res.json({
      success: true,
      data: {
        finalFileUrl
      },
      message: '最终合同文件生成成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 保存签字位置
 * POST /api/contracts/:id/signature-position
 */
router.post('/:id/signature-position', async (req, res) => {
  try {
    const { userId, userName, position, signatureImageUrl } = req.body;
    const positionId = contractService.saveSignaturePosition(
      req.params.id,
      userId,
      userName,
      position,
      signatureImageUrl
    );
    res.json({
      success: true,
      data: { positionId },
      message: '签字位置保存成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
