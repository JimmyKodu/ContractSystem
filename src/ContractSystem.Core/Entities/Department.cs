namespace ContractSystem.Core.Entities;

/// <summary>
/// 部门实体
/// </summary>
public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int CompanyId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Company Company { get; set; } = null!;
    public ICollection<Position> Positions { get; set; } = new List<Position>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
