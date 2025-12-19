using ContractSystem.Core.Enums;

namespace ContractSystem.API.DTOs;

public class CreateContractDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public decimal Amount { get; set; }
    public ContractTemplateType TemplateType { get; set; }
}

public class ApproveContractDto
{
    public ApprovalAction Action { get; set; }
    public string Comments { get; set; } = string.Empty;
    public string? SignatureData { get; set; }
}

public class AddSignatureDto
{
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public int PageNumber { get; set; }
}

public class ContractDto
{
    public int Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public ContractTemplateType TemplateType { get; set; }
    public ContractStatus Status { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<ApprovalDto> Approvals { get; set; } = new();
}

public class ApprovalDto
{
    public string Role { get; set; } = string.Empty;
    public string ApproverName { get; set; } = string.Empty;
    public ApprovalAction Action { get; set; }
    public string Comments { get; set; } = string.Empty;
    public DateTime ApprovedAt { get; set; }
}
