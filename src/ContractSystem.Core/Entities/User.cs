namespace ContractSystem.Core.Entities;

/// <summary>
/// 用户实体
/// </summary>
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public int PositionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Department Department { get; set; } = null!;
    public Position Position { get; set; } = null!;
    public ICollection<Contract> CreatedContracts { get; set; } = new List<Contract>();
    public ICollection<ContractApproval> Approvals { get; set; } = new List<ContractApproval>();
}
