# 部署指南

## 本地开发环境部署

### 1. 安装依赖

确保已安装以下软件：
- .NET 10.0 SDK 或更高版本
- 任意现代浏览器（Chrome、Firefox、Edge等）

### 2. 启动后端API

```bash
# 进入API项目目录
cd src/ContractSystem.API

# 运行API服务
dotnet run
```

API服务将在 `http://localhost:5000` 和 `https://localhost:5001` 启动。

### 3. 访问前端

打开 `frontend/index.html` 文件，或使用本地Web服务器：

**方法1：直接打开**
```bash
# 在浏览器中直接打开
open frontend/index.html  # macOS
start frontend/index.html # Windows
xdg-open frontend/index.html # Linux
```

**方法2：使用Python HTTP服务器**
```bash
cd frontend
python -m http.server 8080
# 然后访问 http://localhost:8080
```

**方法3：使用Node.js http-server**
```bash
cd frontend
npx http-server -p 8080
# 然后访问 http://localhost:8080
```

### 4. 初始化测试数据

首次启动时，系统会自动创建数据库并添加测试数据：
- 公司：示例科技有限公司
- 用户：
  - sales_staff (销售员张三)
  - sales_mgr (销售经理李四)
  - sales_dir (销售总监王五)
  - legal_staff (法务专员赵六)
  - seal_staff (盖章专员钱七)
- 客户：ABC科技公司、XYZ贸易公司

## 生产环境部署

### 使用Docker部署

1. 创建Dockerfile（在项目根目录）：

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/ContractSystem.API/ContractSystem.API.csproj", "ContractSystem.API/"]
COPY ["src/ContractSystem.Core/ContractSystem.Core.csproj", "ContractSystem.Core/"]
COPY ["src/ContractSystem.Infrastructure/ContractSystem.Infrastructure.csproj", "ContractSystem.Infrastructure/"]
RUN dotnet restore "ContractSystem.API/ContractSystem.API.csproj"
COPY src/ .
WORKDIR "/src/ContractSystem.API"
RUN dotnet build "ContractSystem.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ContractSystem.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ContractSystem.API.dll"]
```

2. 构建Docker镜像：
```bash
docker build -t contractsystem:latest .
```

3. 运行容器：
```bash
docker run -d -p 5000:80 -v $(pwd)/uploads:/app/uploads contractsystem:latest
```

### 使用IIS部署（Windows）

1. 发布应用：
```bash
cd src/ContractSystem.API
dotnet publish -c Release -o publish
```

2. 在IIS中创建网站，指向publish目录
3. 配置应用程序池使用 .NET Core
4. 设置适当的文件权限

### 使用Linux服务器部署

1. 安装.NET运行时：
```bash
# Ubuntu/Debian
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y aspnetcore-runtime-10.0
```

2. 发布应用：
```bash
cd src/ContractSystem.API
dotnet publish -c Release -o /var/www/contractsystem
```

3. 创建systemd服务（/etc/systemd/system/contractsystem.service）：
```ini
[Unit]
Description=Contract System API

[Service]
WorkingDirectory=/var/www/contractsystem
ExecStart=/usr/bin/dotnet /var/www/contractsystem/ContractSystem.API.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=contractsystem
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

4. 启动服务：
```bash
sudo systemctl enable contractsystem
sudo systemctl start contractsystem
```

5. 配置Nginx反向代理（/etc/nginx/sites-available/contractsystem）：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 数据库配置

### 切换到SQL Server

修改 `Program.cs` 中的数据库配置：

```csharp
builder.Services.AddDbContext<ContractDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
```

在 `appsettings.json` 中添加连接字符串：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ContractSystem;User Id=sa;Password=YourPassword;TrustServerCertificate=true"
  }
}
```

### 运行迁移

```bash
# 安装EF工具
dotnet tool install --global dotnet-ef

# 创建迁移
cd src/ContractSystem.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../ContractSystem.API

# 应用迁移
dotnet ef database update --startup-project ../ContractSystem.API
```

## 环境变量配置

可以通过环境变量覆盖配置：

```bash
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="your-connection-string"
export CORS_ALLOWED_ORIGINS="https://your-frontend.com"
```

## 故障排查

### API无法启动
- 检查端口5000/5001是否被占用
- 查看日志：`dotnet run --verbosity detailed`

### 前端无法连接API
- 确认API地址配置正确
- 检查CORS设置
- 查看浏览器控制台错误

### 文件上传失败
- 确保uploads目录存在且有写权限
- 检查文件大小限制
- 查看服务器磁盘空间

### 数据库错误
- 确认数据库文件路径
- 检查连接字符串
- 查看EF日志

## 安全建议

1. **生产环境配置**
   - 使用HTTPS
   - 启用身份验证和授权
   - 设置强密码策略
   - 限制CORS来源

2. **文件上传安全**
   - 验证文件类型
   - 限制文件大小
   - 扫描病毒
   - 存储在独立目录

3. **数据库安全**
   - 使用强密码
   - 限制网络访问
   - 定期备份
   - 加密敏感数据

## 监控和日志

推荐使用以下工具：
- Application Insights（Azure）
- Serilog（日志框架）
- Prometheus + Grafana（监控）
- ELK Stack（日志聚合）
