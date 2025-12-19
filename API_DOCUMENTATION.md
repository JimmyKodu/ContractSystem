# API 文档

## 基本信息

- **Base URL**: `http://localhost:5000/api`
- **内容类型**: `application/json` (除文件上传外)
- **身份验证**: 目前为开发模式，未启用身份验证

## 合同管理端点

### 1. 获取合同列表

**GET** `/Contracts`

获取所有合同的列表。

**响应示例**:
```json
[
  {
    "id": 1,
    "contractNumber": "CT20251219023055",
    "title": "软件开发服务合同",
    "description": "为ABC公司开发管理系统",
    "customerId": 1,
    "customerName": "ABC科技公司",
    "amount": 100000.00,
    "templateType": 0,
    "status": 1,
    "createdByUserName": "销售员张三",
    "createdAt": "2025-12-19T02:30:55Z",
    "approvals": [
      {
        "role": "提交人",
        "approverName": "销售员张三",
        "action": 2,
        "comments": "",
        "approvedAt": "2025-12-19T02:30:55Z"
      }
    ]
  }
]
```

### 2. 获取单个合同

**GET** `/Contracts/{id}`

获取指定ID的合同详情。

**路径参数**:
- `id` (integer): 合同ID

**响应**: 同合同列表中的单个对象

### 3. 创建合同

**POST** `/Contracts`

创建新合同。需要使用 `multipart/form-data` 上传文件。

**表单数据**:
- `title` (string, required): 合同标题
- `description` (string): 合同描述
- `customerId` (integer, required): 客户ID
- `amount` (decimal, required): 合同金额
- `templateType` (integer, required): 模板类型（0=公司模板, 1=客户模板）
- `file` (file, required): PDF合同文件

**请求示例**:
```bash
curl -X POST http://localhost:5000/api/Contracts \
  -F "title=软件开发合同" \
  -F "description=为客户开发管理系统" \
  -F "customerId=1" \
  -F "amount=100000.00" \
  -F "templateType=0" \
  -F "file=@contract.pdf"
```

**响应**: 201 Created，返回创建的合同对象

### 4. 审批合同

**POST** `/Contracts/{id}/approve`

审批指定的合同。

**路径参数**:
- `id` (integer): 合同ID

**请求体**:
```json
{
  "action": 0,
  "comments": "审批通过",
  "signatureData": "base64_encoded_signature_image"
}
```

**字段说明**:
- `action` (integer, required): 审批动作（0=批准, 1=拒绝）
- `comments` (string): 审批意见
- `signatureData` (string, optional): Base64编码的签名图片

**响应**: 200 OK，返回更新后的合同对象

### 5. 盖章

**POST** `/Contracts/{id}/seal`

对合同进行盖章操作。

**路径参数**:
- `id` (integer): 合同ID

**请求体**:
```json
"base64_encoded_seal_image"
```

**响应示例**:
```json
{
  "contract": { /* 合同对象 */ },
  "finalPdfPath": "/path/to/final/contract.pdf"
}
```

### 6. 添加签名

**POST** `/Contracts/{id}/signatures`

在PDF上添加可拖动的签名。

**路径参数**:
- `id` (integer): 合同ID

**表单数据**:
- `positionX` (float, required): X坐标
- `positionY` (float, required): Y坐标
- `pageNumber` (integer, required): 页码
- `signatureImage` (file, required): 签名图片文件

**响应**: 200 OK，返回签名对象

### 7. 验证返回的合同

**POST** `/Contracts/{id}/verify`

上传客户返回的合同并进行防篡改验证。

**路径参数**:
- `id` (integer): 合同ID

**表单数据**:
- `returnedFile` (file, required): 客户返回的PDF文件

**响应示例**:
```json
{
  "contract": { /* 合同对象 */ },
  "comparison": {
    "isMatch": true,
    "similarityScore": 0.98,
    "differences": []
  }
}
```

### 8. 下载合同

**GET** `/Contracts/{id}/download`

下载合同PDF文件。

**路径参数**:
- `id` (integer): 合同ID

**响应**: 200 OK，返回PDF文件流

## 数据模型

### ContractStatus 枚举

```
0 - Draft (草稿)
1 - PendingSalesManagerApproval (待销售经理审批)
2 - PendingSalesDirectorApproval (待销售总监审批)
3 - PendingLegalReview (待法务审核)
4 - LegalReviewedPendingSalesManager (法务已审核，待销售经理审批)
5 - LegalReviewedPendingSalesDirector (法务已审核，待销售总监审批)
6 - PendingSeal (待盖章)
7 - Sealed (已盖章完成)
8 - Rejected (已拒绝)
```

### ContractTemplateType 枚举

```
0 - CompanyTemplate (公司模板，不需要法务审核)
1 - CustomerTemplate (客户模板，需要法务审核)
```

### ApprovalAction 枚举

```
0 - Approve (批准)
1 - Reject (拒绝)
2 - Submit (提交)
3 - Seal (盖章)
```

## 工作流示例

### 场景1：公司模板合同流程

1. **创建合同** (销售员)
   ```
   POST /Contracts
   templateType: 0 (公司模板)
   status: 1 (待销售经理审批)
   ```

2. **销售经理审批**
   ```
   POST /Contracts/{id}/approve
   action: 0 (批准)
   status: 2 (待销售总监审批)
   ```

3. **销售总监审批**
   ```
   POST /Contracts/{id}/approve
   action: 0 (批准)
   status: 6 (待盖章)
   ```

4. **盖章**
   ```
   POST /Contracts/{id}/seal
   status: 7 (已完成)
   ```

### 场景2：客户模板合同流程

1. **创建合同** (销售员)
   ```
   POST /Contracts
   templateType: 1 (客户模板)
   status: 3 (待法务审核)
   ```

2. **法务审核**
   ```
   POST /Contracts/{id}/approve
   action: 0 (批准)
   status: 4 (法务已审核，待销售经理审批)
   ```

3. **销售经理审批**
   ```
   POST /Contracts/{id}/approve
   action: 0 (批准)
   status: 5 (法务已审核，待销售总监审批)
   ```

4. **销售总监审批**
   ```
   POST /Contracts/{id}/approve
   action: 0 (批准)
   status: 6 (待盖章)
   ```

5. **盖章**
   ```
   POST /Contracts/{id}/seal
   status: 7 (已完成)
   ```

6. **验证客户返回的合同**
   ```
   POST /Contracts/{id}/verify
   返回对比结果
   ```

## 错误处理

所有API端点都使用标准的HTTP状态码：

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `403 Forbidden`: 没有权限执行操作
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

错误响应示例：
```json
{
  "error": "合同不存在",
  "status": 404
}
```

## 测试工具

### 使用cURL

```bash
# 获取合同列表
curl http://localhost:5000/api/Contracts

# 创建合同
curl -X POST http://localhost:5000/api/Contracts \
  -F "title=测试合同" \
  -F "customerId=1" \
  -F "amount=50000" \
  -F "templateType=0" \
  -F "file=@contract.pdf"

# 审批合同
curl -X POST http://localhost:5000/api/Contracts/1/approve \
  -H "Content-Type: application/json" \
  -d '{"action": 0, "comments": "批准"}'
```

### 使用Postman

1. 导入API端点到Postman
2. 设置环境变量：`base_url = http://localhost:5000/api`
3. 测试各个端点

### 使用Swagger UI

访问 `http://localhost:5000/swagger` 查看交互式API文档。

## 注意事项

1. **文件上传限制**
   - 默认最大文件大小：30MB
   - 仅支持PDF格式
   - 文件保存在 `uploads` 目录

2. **并发控制**
   - 当前版本未实现乐观并发控制
   - 多用户同时审批可能导致冲突

3. **权限验证**
   - 当前版本使用固定用户ID（userId=1）
   - 生产环境需实现JWT身份验证

4. **性能考虑**
   - 大型PDF文件处理可能较慢
   - OCR对比操作是计算密集型
   - 建议使用异步处理长时间操作
