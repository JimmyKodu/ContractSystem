using ContractSystem.Core.Enums;

namespace ContractSystem.Core.Entities;

/// <summary>
/// 合同审批实体
/// </summary>
public class ContractApproval
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public int ApprovedByUserId { get; set; }
    public ApprovalAction Action { get; set; }
    public string Role { get; set; } = string.Empty; // 销售员、销售经理、销售总监、法务、盖章人
    public string Comments { get; set; } = string.Empty;
    public string SignatureData { get; set; } = string.Empty; // 签名图片的Base64数据
    public DateTime ApprovedAt { get; set; }

    // Navigation properties
    public Contract Contract { get; set; } = null!;
    public User ApprovedByUser { get; set; } = null!;
}
