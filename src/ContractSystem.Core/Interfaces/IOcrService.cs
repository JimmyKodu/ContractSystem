namespace ContractSystem.Core.Interfaces;

/// <summary>
/// OCR服务接口 - 用于合同对比验证
/// </summary>
public interface IOcrService
{
    /// <summary>
    /// 提取PDF文本
    /// </summary>
    Task<string> ExtractTextFromPdfAsync(string pdfPath);

    /// <summary>
    /// 对比两个合同文件
    /// </summary>
    Task<ContractComparisonResult> CompareContractsAsync(string originalPdfPath, string returnedPdfPath);
}

/// <summary>
/// 合同对比结果
/// </summary>
public class ContractComparisonResult
{
    public bool IsMatch { get; set; }
    public double SimilarityScore { get; set; }
    public List<string> Differences { get; set; } = new List<string>();
}
