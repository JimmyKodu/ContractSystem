# H5合同管理系统 (Contract Management System)

基于MES系统的H5合同管理系统，实现销售合同的完整审批流程。

## 功能特性

### 1. 销售合同审批流程
- **销售员提起** → **销售经理审批** → **销售总监审批** → **落章**
- 客户模板需额外经过**法务审核**

### 2. 签字记录与时间戳
- 每个审批环节都需要签字确认
- 自动记录签字时间和审批人信息
- 落章人员做最终审批，记录落章时间

### 3. PDF签字位置拖动
- 支持在PDF预览上拖动签字位置
- 可精确定位签名放置位置

### 4. 合同防篡改检测
- 使用AI/OCR识别技术
- 对比客户回传文件与原始文件
- 自动检测文件差异

### 5. 审批链信息展示
- 最终生成的文件包含所有审批人信息
- 显示完整的审批链路

### 6. 客户合同处理
- 支持扫描上传客户合同
- 完成签字和审批落章流程

## 技术架构

### 后端
- **Node.js + Express** - Web服务框架
- **SQLite** - 轻量级数据库
- **pdf-lib** - PDF处理
- **tesseract.js** - OCR文字识别
- **JWT** - 用户认证

### 前端
- **原生HTML5/CSS3/JavaScript**
- **Canvas** - 签名功能
- **移动端适配**

## 项目结构

```
ContractSystem/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── app.js          # 主入口
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API路由
│   │   ├── services/       # 业务服务
│   │   └── utils/          # 工具函数
│   ├── database/           # SQLite数据库
│   ├── uploads/            # 上传文件目录
│   └── package.json
├── frontend/               # 前端H5页面
│   ├── index.html          # 主页面
│   ├── src/
│   │   ├── main.js         # 主程序
│   │   ├── assets/         # 样式文件
│   │   └── utils/          # 工具函数
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 启动服务

```bash
# 启动后端API (端口3000)
cd backend
npm start

# 启动前端开发服务器 (端口8080)
cd frontend
npm run dev
```

### 3. 访问系统

打开浏览器访问: `http://localhost:8080`

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| salesperson1 | 123456 | 销售员 |
| salesmanager1 | 123456 | 销售经理 |
| salesdirector1 | 123456 | 销售总监 |
| legal1 | 123456 | 法务人员 |
| sealkeeper1 | 123456 | 落章人员 |
| admin | 123456 | 管理员 |

## API接口

### 用户认证
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息

### 合同管理
- `GET /api/contracts` - 获取合同列表
- `POST /api/contracts` - 创建合同
- `GET /api/contracts/:id` - 获取合同详情
- `POST /api/contracts/:id/submit` - 提交审批
- `POST /api/contracts/:id/approve` - 审批通过
- `POST /api/contracts/:id/reject` - 拒绝合同
- `POST /api/contracts/:id/upload` - 上传合同文件
- `POST /api/contracts/:id/compare` - 合同文件比对
- `POST /api/contracts/:id/generate-final` - 生成最终文件

### 客户管理
- `GET /api/customers` - 获取客户列表
- `POST /api/customers` - 创建客户

## 审批流程说明

### 我方模板合同
```
销售员(创建并提交) → 销售经理(审批) → 销售总监(审批) → 落章人员(落章)
```

### 客户模板合同
```
销售员(创建并提交) → 销售经理(审批) → 销售总监(审批) → 法务(审核) → 落章人员(落章)
```

## 合同状态

| 状态 | 说明 |
|------|------|
| draft | 草稿 |
| pending_sales_manager | 待销售经理审批 |
| pending_sales_director | 待销售总监审批 |
| pending_legal | 待法务审核 |
| pending_seal | 待落章 |
| approved | 已批准 |
| sealed | 已落章 |
| rejected | 已拒绝 |

## License

MIT