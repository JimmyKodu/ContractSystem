namespace ContractSystem.Core.Enums;

/// <summary>
/// 合同状态枚举
/// </summary>
public enum ContractStatus
{
    /// <summary>
    /// 草稿
    /// </summary>
    Draft = 0,

    /// <summary>
    /// 待销售经理审批
    /// </summary>
    PendingSalesManagerApproval = 1,

    /// <summary>
    /// 销售经理已审批，待销售总监审批
    /// </summary>
    PendingSalesDirectorApproval = 2,

    /// <summary>
    /// 待法务审核（客户模板需要法务审核）
    /// </summary>
    PendingLegalReview = 3,

    /// <summary>
    /// 法务已审核，待销售经理审批
    /// </summary>
    LegalReviewedPendingSalesManager = 4,

    /// <summary>
    /// 法务已审核，待销售总监审批
    /// </summary>
    LegalReviewedPendingSalesDirector = 5,

    /// <summary>
    /// 待盖章
    /// </summary>
    PendingSeal = 6,

    /// <summary>
    /// 已盖章完成
    /// </summary>
    Sealed = 7,

    /// <summary>
    /// 已拒绝
    /// </summary>
    Rejected = 8
}
