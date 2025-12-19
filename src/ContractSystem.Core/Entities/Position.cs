namespace ContractSystem.Core.Entities;

/// <summary>
/// 岗位实体
/// </summary>
public class Position
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Department Department { get; set; } = null!;
    public ICollection<User> Users { get; set; } = new List<User>();
}
