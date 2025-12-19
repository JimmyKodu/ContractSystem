using ContractSystem.Core.Enums;

namespace ContractSystem.Core.Entities;

/// <summary>
/// 合同实体
/// </summary>
public class Contract
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public decimal Amount { get; set; }
    public ContractTemplateType TemplateType { get; set; }
    public ContractStatus Status { get; set; }
    public int CreatedByUserId { get; set; }
    public string OriginalFilePath { get; set; } = string.Empty;
    public string FinalFilePath { get; set; } = string.Empty;
    public string CustomerReturnedFilePath { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Customer Customer { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public ICollection<ContractApproval> Approvals { get; set; } = new List<ContractApproval>();
    public ICollection<Signature> Signatures { get; set; } = new List<Signature>();
}
