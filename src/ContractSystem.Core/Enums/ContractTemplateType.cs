namespace ContractSystem.Core.Enums;

/// <summary>
/// 合同模板类型
/// </summary>
public enum ContractTemplateType
{
    /// <summary>
    /// 公司模板（不需要法务审核）
    /// </summary>
    CompanyTemplate = 0,

    /// <summary>
    /// 客户模板（需要法务审核）
    /// </summary>
    CustomerTemplate = 1
}
