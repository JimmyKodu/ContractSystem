// PDF处理和OCR服务
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 计算文件哈希值（用于防篡改检测）
 */
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// OCR配置 - 可以通过环境变量配置
const OCR_LANGUAGE = process.env.OCR_LANGUAGE || 'chi_sim+eng';
const OCR_TIMEOUT = parseInt(process.env.OCR_TIMEOUT, 10) || 60000; // 默认60秒超时

/**
 * OCR识别图片或PDF中的文本
 */
async function extractTextFromImage(imagePath) {
  try {
    // 添加超时机制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OCR处理超时')), OCR_TIMEOUT);
    });
    
    const ocrPromise = Tesseract.recognize(imagePath, OCR_LANGUAGE, {
      logger: process.env.NODE_ENV === 'development' ? (m) => console.log(m) : undefined
    });
    
    const result = await Promise.race([ocrPromise, timeoutPromise]);
    return result.data.text;
  } catch (error) {
    console.error('OCR识别错误:', error.message);
    throw error;
  }
}

/**
 * 比较两个文本的相似度（用于合同对比）
 */
function compareTexts(text1, text2) {
  // 简化的文本比较算法
  const words1 = text1.toLowerCase().replace(/\s+/g, ' ').split(' ');
  const words2 = text2.toLowerCase().replace(/\s+/g, ' ').split(' ');
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const similarity = intersection.size / union.size;
  
  // 找出差异
  const onlyInFirst = [...set1].filter(x => !set2.has(x));
  const onlyInSecond = [...set2].filter(x => !set1.has(x));
  
  return {
    similarity: Math.round(similarity * 100),
    match: similarity >= 0.95,
    differences: {
      onlyInOriginal: onlyInFirst,
      onlyInReturned: onlyInSecond
    }
  };
}

/**
 * 在PDF上添加签名图片
 */
async function addSignatureToPdf(pdfPath, signatureImagePath, position, outputPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const signatureBytes = fs.readFileSync(signatureImagePath);
    let signatureImage;
    
    if (signatureImagePath.endsWith('.png')) {
      signatureImage = await pdfDoc.embedPng(signatureBytes);
    } else if (signatureImagePath.endsWith('.jpg') || signatureImagePath.endsWith('.jpeg')) {
      signatureImage = await pdfDoc.embedJpg(signatureBytes);
    } else {
      throw new Error('不支持的图片格式，请使用PNG或JPG');
    }
    
    const pages = pdfDoc.getPages();
    const pageIndex = (position.pageNumber || 1) - 1;
    
    if (pageIndex >= pages.length) {
      throw new Error('指定的页码超出PDF页数');
    }
    
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    
    page.drawImage(signatureImage, {
      x: position.x,
      y: height - position.y - (position.height || 60), // PDF坐标系从底部开始
      width: position.width || 150,
      height: position.height || 60
    });
    
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('添加签名到PDF错误:', error);
    throw error;
  }
}

/**
 * 在PDF最后一页添加审批链信息
 */
async function addApprovalChainToPdf(pdfPath, approvalRecords, outputPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 添加新页面用于显示审批链
    const page = pdfDoc.addPage([595, 842]); // A4尺寸
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const { width, height } = page.getSize();
    let y = height - 50;
    
    // 列配置 - 便于维护和调整
    const columns = {
      no: { x: 50, width: 30, label: 'No.' },
      role: { x: 80, width: 120, label: 'Role' },
      user: { x: 200, width: 80, label: 'User' },
      time: { x: 280, width: 120, label: 'Time' },
      type: { x: 400, width: 100, label: 'Type' }
    };
    
    // 角色和类型映射
    const roleMap = {
      'salesperson': 'Salesperson/销售员',
      'sales_manager': 'Sales Manager/销售经理',
      'sales_director': 'Sales Director/销售总监',
      'legal_staff': 'Legal Staff/法务',
      'seal_keeper': 'Seal Keeper/落章人'
    };
    
    const typeMap = {
      'submit': 'Submit/提交',
      'approve': 'Approve/批准',
      'reject': 'Reject/拒绝',
      'legal_review': 'Legal Review/法务审核',
      'seal': 'Seal/落章'
    };
    
    // 标题
    page.drawText('Contract Approval Chain / 合同审批链', {
      x: 50,
      y: y,
      size: 16,
      font,
      color: rgb(0, 0, 0)
    });
    
    y -= 40;
    
    // 表头
    Object.values(columns).forEach(col => {
      page.drawText(col.label, {
        x: col.x,
        y: y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3)
      });
    });
    
    y -= 5;
    page.drawLine({
      start: { x: 50, y: y },
      end: { x: width - 50, y: y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
    
    y -= 20;
    
    // 审批记录
    approvalRecords.forEach((record, index) => {
      const role = roleMap[record.user_role] || record.user_role;
      const type = typeMap[record.type] || record.type;
      const time = new Date(record.timestamp).toLocaleString('zh-CN');
      
      // 绘制每一列
      page.drawText(`${index + 1}`, { x: columns.no.x, y, size: 9, font, color: rgb(0, 0, 0) });
      page.drawText(role.substring(0, 18), { x: columns.role.x, y, size: 9, font, color: rgb(0, 0, 0) });
      page.drawText((record.user_name || '').substring(0, 10), { x: columns.user.x, y, size: 9, font, color: rgb(0, 0, 0) });
      page.drawText(time.substring(0, 16), { x: columns.time.x, y, size: 9, font, color: rgb(0, 0, 0) });
      page.drawText(type.substring(0, 15), { x: columns.type.x, y, size: 9, font, color: rgb(0, 0, 0) });
      
      y -= 25;
      
      if (y < 100) {
        // 如果页面空间不够，这里可以添加新页面
        // 简化处理，实际项目中需要更完善的分页逻辑
      }
    });
    
    // 页脚
    y = 50;
    page.drawText('This page is automatically generated by Contract System / 本页由合同系统自动生成', {
      x: 50,
      y: y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('添加审批链到PDF错误:', error);
    throw error;
  }
}

/**
 * 比较两个PDF文件（原始发出的和客户回传的）
 */
async function comparePdfFiles(originalPath, returnedPath) {
  try {
    // 计算文件哈希
    const originalHash = await calculateFileHash(originalPath);
    const returnedHash = await calculateFileHash(returnedPath);
    
    // 如果哈希相同，文件完全一致
    if (originalHash === returnedHash) {
      return {
        match: true,
        hashMatch: true,
        similarity: 100,
        message: '文件完全一致，未被篡改'
      };
    }
    
    // 使用OCR提取文本进行比较
    const originalText = await extractTextFromImage(originalPath);
    const returnedText = await extractTextFromImage(returnedPath);
    
    const textComparison = compareTexts(originalText, returnedText);
    
    return {
      match: textComparison.match,
      hashMatch: false,
      similarity: textComparison.similarity,
      differences: textComparison.differences,
      message: textComparison.match 
        ? '文件内容相似度较高，可能仅有格式差异' 
        : '检测到文件内容差异，请人工核查'
    };
  } catch (error) {
    console.error('PDF比较错误:', error);
    throw error;
  }
}

module.exports = {
  calculateFileHash,
  extractTextFromImage,
  compareTexts,
  addSignatureToPdf,
  addApprovalChainToPdf,
  comparePdfFiles
};
