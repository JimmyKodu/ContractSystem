using ContractSystem.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContractSystem.Infrastructure.Data;

/// <summary>
/// 合同系统数据库上下文
/// </summary>
public class ContractDbContext : DbContext
{
    public ContractDbContext(DbContextOptions<ContractDbContext> options) : base(options)
    {
    }

    public DbSet<Company> Companies { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Position> Positions { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Contract> Contracts { get; set; }
    public DbSet<ContractApproval> ContractApprovals { get; set; }
    public DbSet<Signature> Signatures { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Company configuration
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Department configuration
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Company)
                .WithMany(e => e.Departments)
                .HasForeignKey(e => e.CompanyId);
        });

        // Position configuration
        modelBuilder.Entity<Position>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Department)
                .WithMany(e => e.Positions)
                .HasForeignKey(e => e.DepartmentId);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasOne(e => e.Department)
                .WithMany(e => e.Users)
                .HasForeignKey(e => e.DepartmentId);
            entity.HasOne(e => e.Position)
                .WithMany(e => e.Users)
                .HasForeignKey(e => e.PositionId);
        });

        // Customer configuration
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Contract configuration
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ContractNumber).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.HasIndex(e => e.ContractNumber).IsUnique();
            entity.HasOne(e => e.Customer)
                .WithMany(e => e.Contracts)
                .HasForeignKey(e => e.CustomerId);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany(e => e.CreatedContracts)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ContractApproval configuration
        modelBuilder.Entity<ContractApproval>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.HasOne(e => e.Contract)
                .WithMany(e => e.Approvals)
                .HasForeignKey(e => e.ContractId);
            entity.HasOne(e => e.ApprovedByUser)
                .WithMany(e => e.Approvals)
                .HasForeignKey(e => e.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Signature configuration
        modelBuilder.Entity<Signature>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Contract)
                .WithMany(e => e.Signatures)
                .HasForeignKey(e => e.ContractId);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
