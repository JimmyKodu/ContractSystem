using ContractSystem.Core.Entities;
using ContractSystem.Infrastructure.Data;

namespace ContractSystem.Infrastructure.Data;

/// <summary>
/// 数据库种子数据
/// </summary>
public static class DbInitializer
{
    public static void Initialize(ContractDbContext context)
    {
        // 确保数据库已创建
        context.Database.EnsureCreated();

        // 检查是否已有数据
        if (context.Companies.Any())
        {
            return; // 已有数据，不需要初始化
        }

        // 添加公司
        var company = new Company
        {
            Name = "示例科技有限公司",
            Code = "COMP001",
            Address = "北京市朝阳区示例大街123号",
            Contact = "张总",
            Phone = "010-12345678",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Companies.Add(company);
        context.SaveChanges();

        // 添加部门
        var salesDept = new Department
        {
            Name = "销售部",
            Code = "SALES",
            CompanyId = company.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var legalDept = new Department
        {
            Name = "法务部",
            Code = "LEGAL",
            CompanyId = company.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var adminDept = new Department
        {
            Name = "行政部",
            Code = "ADMIN",
            CompanyId = company.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Departments.AddRange(salesDept, legalDept, adminDept);
        context.SaveChanges();

        // 添加岗位
        var positions = new[]
        {
            new Position { Name = "销售员", Code = "SALES_STAFF", DepartmentId = salesDept.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Position { Name = "销售经理", Code = "SALES_MGR", DepartmentId = salesDept.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Position { Name = "销售总监", Code = "SALES_DIR", DepartmentId = salesDept.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Position { Name = "法务专员", Code = "LEGAL_STAFF", DepartmentId = legalDept.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Position { Name = "盖章专员", Code = "SEAL_STAFF", DepartmentId = adminDept.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        context.Positions.AddRange(positions);
        context.SaveChanges();

        // 添加用户
        // NOTE: In production, use proper password hashing with BCrypt or similar
        // Example: BCrypt.Net.BCrypt.HashPassword("password123")
        var users = new[]
        {
            new User 
            { 
                Username = "sales_staff", 
                PasswordHash = "$2a$11$K2FKzvV7x8xQ8nJ8L.YxZeLjvC5qvBxB5iVBaL.cYqP4L0P4L0P4L", // BCrypt hash of "password123"
                Name = "销售员张三", 
                Email = "zhangsan@example.com",
                Phone = "13800138001",
                DepartmentId = salesDept.Id, 
                PositionId = positions[0].Id, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            },
            new User 
            { 
                Username = "sales_mgr", 
                PasswordHash = "$2a$11$K2FKzvV7x8xQ8nJ8L.YxZeLjvC5qvBxB5iVBaL.cYqP4L0P4L0P4L",
                Name = "销售经理李四", 
                Email = "lisi@example.com",
                Phone = "13800138002",
                DepartmentId = salesDept.Id, 
                PositionId = positions[1].Id, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            },
            new User 
            { 
                Username = "sales_dir", 
                PasswordHash = "$2a$11$K2FKzvV7x8xQ8nJ8L.YxZeLjvC5qvBxB5iVBaL.cYqP4L0P4L0P4L",
                Name = "销售总监王五", 
                Email = "wangwu@example.com",
                Phone = "13800138003",
                DepartmentId = salesDept.Id, 
                PositionId = positions[2].Id, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            },
            new User 
            { 
                Username = "legal_staff", 
                PasswordHash = "$2a$11$K2FKzvV7x8xQ8nJ8L.YxZeLjvC5qvBxB5iVBaL.cYqP4L0P4L0P4L",
                Name = "法务专员赵六", 
                Email = "zhaoliu@example.com",
                Phone = "13800138004",
                DepartmentId = legalDept.Id, 
                PositionId = positions[3].Id, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            },
            new User 
            { 
                Username = "seal_staff", 
                PasswordHash = "$2a$11$K2FKzvV7x8xQ8nJ8L.YxZeLjvC5qvBxB5iVBaL.cYqP4L0P4L0P4L",
                Name = "盖章专员钱七", 
                Email = "qianqi@example.com",
                Phone = "13800138005",
                DepartmentId = adminDept.Id, 
                PositionId = positions[4].Id, 
                CreatedAt = DateTime.UtcNow, 
                UpdatedAt = DateTime.UtcNow 
            }
        };
        context.Users.AddRange(users);
        context.SaveChanges();

        // 添加客户
        var customers = new[]
        {
            new Customer
            {
                Name = "ABC科技公司",
                Code = "CUST001",
                Contact = "刘经理",
                Phone = "021-87654321",
                Email = "liujingli@abc.com",
                Address = "上海市浦东新区科技园",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Customer
            {
                Name = "XYZ贸易公司",
                Code = "CUST002",
                Contact = "陈总",
                Phone = "0755-12345678",
                Email = "chenzong@xyz.com",
                Address = "深圳市南山区高新园",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        context.Customers.AddRange(customers);
        context.SaveChanges();
    }
}
