namespace ContractSystem.Core.Interfaces;

/// <summary>
/// PDF服务接口
/// </summary>
public interface IPdfService
{
    /// <summary>
    /// 在PDF上添加签名
    /// </summary>
    Task<string> AddSignatureToPdfAsync(string pdfPath, string signatureImagePath, float x, float y, int pageNumber);

    /// <summary>
    /// 在PDF最后一页添加审批链信息
    /// </summary>
    Task<string> AddApprovalChainToPdfAsync(string pdfPath, List<ApprovalChainInfo> approvalChain);

    /// <summary>
    /// 生成最终合同PDF
    /// </summary>
    Task<string> GenerateFinalContractPdfAsync(int contractId);
}

/// <summary>
/// 审批链信息
/// </summary>
public class ApprovalChainInfo
{
    public string Role { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime ApprovedAt { get; set; }
    public string? SignatureData { get; set; }
}
