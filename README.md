# ContractSystem - H5合同管理系统

一个基于ASP.NET Core的完整合同管理系统，实现销售合同全流程管理。

## 功能特性

### 核心功能

1. **合同工作流管理**
   - 销售员提起合同
   - 多级审批流程：销售经理 → 销售总监
   - 法务审核支持（针对客户模板）
   - 最终盖章确认

2. **审批链记录**
   - 完整记录所有审批人的签名和时间
   - 提交人及各层级审核人信息
   - 落章人员和落章时间

3. **合同防篡改验证**
   - 客户回传合同与发出合同对比
   - AI/OCR识别技术
   - 自动计算相似度
   - 标记差异点

4. **PDF文档处理**
   - PDF签名可拖动定位
   - 最后一页自动添加审批链信息
   - 生成带完整审批记录的最终文件

5. **灵活的模板支持**
   - 公司模板（无需法务审核）
   - 客户模板（需要法务审核）
   - 客户扫描上传支持

## 技术栈

### 后端
- ASP.NET Core 10.0
- Entity Framework Core (SQLite)
- iTextSharp.LGPLv2.Core (PDF处理)
- Tesseract (OCR文字识别)

### 前端
- 原生HTML5/CSS3/JavaScript
- 响应式设计，支持移动端
- RESTful API集成

## 项目结构

```
ContractSystem/
├── src/
│   ├── ContractSystem.API/          # Web API项目
│   │   ├── Controllers/             # API控制器
│   │   ├── DTOs/                    # 数据传输对象
│   │   └── Program.cs               # 启动配置
│   ├── ContractSystem.Core/         # 核心领域层
│   │   ├── Entities/                # 实体类
│   │   ├── Enums/                   # 枚举
│   │   └── Interfaces/              # 服务接口
│   └── ContractSystem.Infrastructure/ # 基础设施层
│       ├── Data/                    # 数据访问
│       └── Services/                # 服务实现
├── frontend/                        # H5前端
│   └── index.html                   # 主页面
└── README.md                        # 项目文档
```

## 快速开始

### 前置要求
- .NET 10.0 SDK
- 支持的操作系统：Windows, Linux, macOS

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/JimmyKodu/ContractSystem.git
cd ContractSystem
```

2. 构建项目
```bash
dotnet build
```

3. 运行API服务
```bash
cd src/ContractSystem.API
dotnet run
```

4. 打开前端
在浏览器中打开 `frontend/index.html` 文件，或使用本地服务器：
```bash
cd frontend
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## API端点

### 合同管理

- `GET /api/Contracts` - 获取合同列表
- `GET /api/Contracts/{id}` - 获取合同详情
- `POST /api/Contracts` - 创建新合同
- `POST /api/Contracts/{id}/approve` - 审批合同
- `POST /api/Contracts/{id}/seal` - 盖章
- `POST /api/Contracts/{id}/signatures` - 添加签名
- `POST /api/Contracts/{id}/verify` - 验证客户返回合同
- `GET /api/Contracts/{id}/download` - 下载合同文件

## 合同工作流程

### 公司模板流程
```
提交 → 销售经理审批 → 销售总监审批 → 盖章 → 完成
```

### 客户模板流程
```
提交 → 法务审核 → 销售经理审批 → 销售总监审批 → 盖章 → 完成
```

## 数据模型

### 核心实体
- **Company** - 公司
- **Department** - 部门
- **Position** - 岗位
- **User** - 用户
- **Customer** - 客户
- **Contract** - 合同
- **ContractApproval** - 合同审批记录
- **Signature** - 签名记录

## 安全特性

1. **防篡改验证**
   - OCR文本提取
   - Levenshtein距离算法
   - 相似度阈值：95%

2. **审批链追溯**
   - 完整的时间戳记录
   - 不可修改的审批历史
   - 数字签名支持

## 开发指南

### 添加新的审批角色

1. 更新 `ContractStatus` 枚举
2. 修改 `ContractWorkflowService.GetNextStatus()` 方法
3. 更新 `CanUserApproveContractAsync()` 逻辑

### 自定义PDF模板

修改 `PdfService.AddApprovalChainToPdfAsync()` 方法以自定义审批链的显示格式。

## 贡献

欢迎提交问题和拉取请求。

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题，请通过GitHub Issues联系。
