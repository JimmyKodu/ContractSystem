using ContractSystem.Core.Entities;
using ContractSystem.Core.Enums;
using ContractSystem.Core.Interfaces;
using ContractSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ContractSystem.Infrastructure.Services;

/// <summary>
/// 合同工作流服务实现
/// </summary>
public class ContractWorkflowService : IContractWorkflowService
{
    private readonly ContractDbContext _context;

    public ContractWorkflowService(ContractDbContext context)
    {
        _context = context;
    }

    public async Task<Contract> SubmitContractAsync(Contract contract, int userId)
    {
        contract.CreatedByUserId = userId;
        contract.CreatedAt = DateTime.UtcNow;
        contract.UpdatedAt = DateTime.UtcNow;

        // 根据模板类型决定流程
        if (contract.TemplateType == ContractTemplateType.CustomerTemplate)
        {
            // 客户模板需要先法务审核
            contract.Status = ContractStatus.PendingLegalReview;
        }
        else
        {
            // 公司模板直接进入销售经理审批
            contract.Status = ContractStatus.PendingSalesManagerApproval;
        }

        // 记录提交动作
        var approval = new ContractApproval
        {
            ContractId = contract.Id,
            ApprovedByUserId = userId,
            Action = ApprovalAction.Submit,
            Role = "提交人",
            ApprovedAt = DateTime.UtcNow
        };

        _context.Contracts.Add(contract);
        _context.ContractApprovals.Add(approval);
        await _context.SaveChangesAsync();

        return contract;
    }

    public async Task<Contract> ApproveContractAsync(int contractId, int userId, ApprovalAction action, string comments, string? signatureData = null)
    {
        var contract = await _context.Contracts
            .Include(c => c.Approvals)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
        {
            throw new ArgumentException("合同不存在");
        }

        // 记录当前状态对应的审批角色
        var currentRole = GetRoleByStatus(contract.Status);

        // 根据当前状态和操作更新合同状态
        if (action == ApprovalAction.Reject)
        {
            contract.Status = ContractStatus.Rejected;
        }
        else if (action == ApprovalAction.Approve)
        {
            contract.Status = GetNextStatus(contract.Status, contract.TemplateType);
        }

        contract.UpdatedAt = DateTime.UtcNow;

        // 记录审批 - 使用保存的当前角色
        var approval = new ContractApproval
        {
            ContractId = contractId,
            ApprovedByUserId = userId,
            Action = action,
            Role = currentRole,
            Comments = comments,
            SignatureData = signatureData ?? string.Empty,
            ApprovedAt = DateTime.UtcNow
        };

        _context.ContractApprovals.Add(approval);
        await _context.SaveChangesAsync();

        return contract;
    }

    public async Task<Contract> SealContractAsync(int contractId, int userId, string signatureData)
    {
        var contract = await _context.Contracts
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
        {
            throw new ArgumentException("合同不存在");
        }

        if (contract.Status != ContractStatus.PendingSeal)
        {
            throw new InvalidOperationException("合同状态不正确，无法盖章");
        }

        contract.Status = ContractStatus.Sealed;
        contract.UpdatedAt = DateTime.UtcNow;

        // 记录盖章
        var approval = new ContractApproval
        {
            ContractId = contractId,
            ApprovedByUserId = userId,
            Action = ApprovalAction.Seal,
            Role = "盖章人",
            SignatureData = signatureData,
            ApprovedAt = DateTime.UtcNow
        };

        _context.ContractApprovals.Add(approval);
        await _context.SaveChangesAsync();

        return contract;
    }

    public async Task<bool> CanUserApproveContractAsync(int contractId, int userId)
    {
        var contract = await _context.Contracts
            .Include(c => c.CreatedByUser)
            .ThenInclude(u => u.Position)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null) return false;

        var user = await _context.Users
            .Include(u => u.Position)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return false;

        // 根据合同状态和用户岗位判断是否可以审批
        return contract.Status switch
        {
            ContractStatus.PendingSalesManagerApproval => user.Position.Name.Contains("销售经理"),
            ContractStatus.PendingSalesDirectorApproval => user.Position.Name.Contains("销售总监"),
            ContractStatus.PendingLegalReview => user.Position.Name.Contains("法务"),
            ContractStatus.LegalReviewedPendingSalesManager => user.Position.Name.Contains("销售经理"),
            ContractStatus.LegalReviewedPendingSalesDirector => user.Position.Name.Contains("销售总监"),
            ContractStatus.PendingSeal => user.Position.Name.Contains("盖章"),
            _ => false
        };
    }

    private ContractStatus GetNextStatus(ContractStatus currentStatus, ContractTemplateType templateType)
    {
        return currentStatus switch
        {
            ContractStatus.PendingLegalReview => ContractStatus.LegalReviewedPendingSalesManager,
            ContractStatus.LegalReviewedPendingSalesManager => ContractStatus.LegalReviewedPendingSalesDirector,
            ContractStatus.LegalReviewedPendingSalesDirector => ContractStatus.PendingSeal,
            ContractStatus.PendingSalesManagerApproval => ContractStatus.PendingSalesDirectorApproval,
            ContractStatus.PendingSalesDirectorApproval => ContractStatus.PendingSeal,
            _ => currentStatus
        };
    }

    private string GetRoleByStatus(ContractStatus status)
    {
        return status switch
        {
            ContractStatus.PendingSalesManagerApproval or ContractStatus.LegalReviewedPendingSalesManager => "销售经理",
            ContractStatus.PendingSalesDirectorApproval or ContractStatus.LegalReviewedPendingSalesDirector => "销售总监",
            ContractStatus.PendingLegalReview => "法务",
            ContractStatus.PendingSeal => "盖章人",
            _ => "未知"
        };
    }
}
