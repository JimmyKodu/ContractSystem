using ContractSystem.Core.Interfaces;
using iTextSharp.text.pdf;
using Tesseract;

namespace ContractSystem.Infrastructure.Services;

/// <summary>
/// OCR服务实现 - 用于合同对比验证
/// </summary>
public class OcrService : IOcrService
{
    private readonly string _tessDataPath;

    public OcrService(string tessDataPath)
    {
        _tessDataPath = tessDataPath;
    }

    public async Task<string> ExtractTextFromPdfAsync(string pdfPath)
    {
        var text = string.Empty;

        using (var reader = new PdfReader(pdfPath))
        {
            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                // 简单提取文本，iTextSharp.LGPLv2.Core版本可能需要不同的方法
                // 这里提供基本实现
                var pageBytes = reader.GetPageContent(page);
                if (pageBytes != null)
                {
                    text += System.Text.Encoding.UTF8.GetString(pageBytes);
                }
            }
        }

        return await Task.FromResult(text);
    }

    public async Task<ContractComparisonResult> CompareContractsAsync(string originalPdfPath, string returnedPdfPath)
    {
        var originalText = await ExtractTextFromPdfAsync(originalPdfPath);
        var returnedText = await ExtractTextFromPdfAsync(returnedPdfPath);

        // 计算相似度
        var similarity = CalculateSimilarity(originalText, returnedText);
        
        // 查找差异
        var differences = FindDifferences(originalText, returnedText);

        return new ContractComparisonResult
        {
            IsMatch = similarity > 0.95, // 95%以上相似度认为匹配
            SimilarityScore = similarity,
            Differences = differences
        };
    }

    private double CalculateSimilarity(string text1, string text2)
    {
        // 简单的相似度计算 - 使用Levenshtein距离
        var distance = LevenshteinDistance(text1, text2);
        var maxLength = Math.Max(text1.Length, text2.Length);
        
        if (maxLength == 0) return 1.0;
        
        return 1.0 - (double)distance / maxLength;
    }

    private int LevenshteinDistance(string s1, string s2)
    {
        var n = s1.Length;
        var m = s2.Length;
        var d = new int[n + 1, m + 1];

        if (n == 0) return m;
        if (m == 0) return n;

        for (int i = 0; i <= n; i++) d[i, 0] = i;
        for (int j = 0; j <= m; j++) d[0, j] = j;

        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= m; j++)
            {
                var cost = (s2[j - 1] == s1[i - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }

        return d[n, m];
    }

    private List<string> FindDifferences(string text1, string text2)
    {
        var differences = new List<string>();
        
        var lines1 = text1.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var lines2 = text2.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

        // 简单的逐行对比
        var maxLines = Math.Max(lines1.Length, lines2.Length);
        for (int i = 0; i < maxLines; i++)
        {
            var line1 = i < lines1.Length ? lines1[i].Trim() : "";
            var line2 = i < lines2.Length ? lines2[i].Trim() : "";

            if (line1 != line2)
            {
                differences.Add($"第{i + 1}行不同: 原文 '{line1}' vs 返回 '{line2}'");
            }
        }

        return differences.Take(20).ToList(); // 限制只返回前20个差异
    }
}
