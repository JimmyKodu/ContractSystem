using ContractSystem.Core.Entities;
using ContractSystem.Core.Enums;

namespace ContractSystem.Core.Interfaces;

/// <summary>
/// 合同工作流服务接口
/// </summary>
public interface IContractWorkflowService
{
    /// <summary>
    /// 提交合同
    /// </summary>
    Task<Contract> SubmitContractAsync(Contract contract, int userId);

    /// <summary>
    /// 审批合同
    /// </summary>
    Task<Contract> ApproveContractAsync(int contractId, int userId, ApprovalAction action, string comments, string? signatureData = null);

    /// <summary>
    /// 盖章
    /// </summary>
    Task<Contract> SealContractAsync(int contractId, int userId, string signatureData);

    /// <summary>
    /// 检查用户是否可以审批合同
    /// </summary>
    Task<bool> CanUserApproveContractAsync(int contractId, int userId);
}
