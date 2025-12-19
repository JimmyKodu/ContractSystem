using ContractSystem.Core.Interfaces;
using iTextSharp.text;
using iTextSharp.text.pdf;
using ContractSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ContractSystem.Infrastructure.Services;

/// <summary>
/// PDF服务实现
/// </summary>
public class PdfService : IPdfService
{
    private readonly ContractDbContext _context;
    private readonly string _uploadPath;

    public PdfService(ContractDbContext context, string uploadPath)
    {
        _context = context;
        _uploadPath = uploadPath;
        
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> AddSignatureToPdfAsync(string pdfPath, string signatureImagePath, float x, float y, int pageNumber)
    {
        var outputPath = Path.Combine(_uploadPath, $"signed_{Guid.NewGuid()}.pdf");

        using (var reader = new PdfReader(pdfPath))
        using (var stamper = new PdfStamper(reader, new FileStream(outputPath, FileMode.Create)))
        {
            var img = Image.GetInstance(signatureImagePath);
            img.SetAbsolutePosition(x, y);
            img.ScaleToFit(100f, 50f);

            var content = stamper.GetOverContent(pageNumber);
            content.AddImage(img);
        }

        return await Task.FromResult(outputPath);
    }

    public async Task<string> AddApprovalChainToPdfAsync(string pdfPath, List<ApprovalChainInfo> approvalChain)
    {
        var outputPath = Path.Combine(_uploadPath, $"with_approval_chain_{Guid.NewGuid()}.pdf");

        using (var reader = new PdfReader(pdfPath))
        using (var stamper = new PdfStamper(reader, new FileStream(outputPath, FileMode.Create)))
        {
            var totalPages = reader.NumberOfPages;
            var content = stamper.GetOverContent(totalPages);

            // Try to create a font that works across systems
            BaseFont baseFont;
            try
            {
                // Try Chinese font first
                baseFont = BaseFont.CreateFont("STSong-Light", "UniGB-UCS2-H", BaseFont.NOT_EMBEDDED);
            }
            catch
            {
                try
                {
                    // Fallback to Arial Unicode MS for broader compatibility
                    baseFont = BaseFont.CreateFont("Arial Unicode MS", BaseFont.IDENTITY_H, BaseFont.NOT_EMBEDDED);
                }
                catch
                {
                    // Final fallback to Helvetica (always available)
                    baseFont = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                }
            }

            content.BeginText();
            content.SetFontAndSize(baseFont, 10);

            float yPosition = 200;
            content.SetTextMatrix(50, yPosition);
            content.ShowText("Contract Approval Chain / 合同审批链:");

            yPosition -= 20;
            foreach (var approval in approvalChain)
            {
                content.SetTextMatrix(50, yPosition);
                var approvalText = $"{approval.Role}: {approval.Name} - {approval.ApprovedAt:yyyy-MM-dd HH:mm:ss}";
                content.ShowText(approvalText);
                yPosition -= 15;

                // 如果有签名数据，可以添加签名图片
                if (!string.IsNullOrEmpty(approval.SignatureData))
                {
                    // 这里可以添加签名图片的逻辑
                }
            }

            content.EndText();
        }

        return await Task.FromResult(outputPath);
    }

    public async Task<string> GenerateFinalContractPdfAsync(int contractId)
    {
        var contract = await _context.Contracts
            .Include(c => c.Approvals)
            .ThenInclude(a => a.ApprovedByUser)
            .Include(c => c.Signatures)
            .FirstOrDefaultAsync(c => c.Id == contractId);

        if (contract == null)
        {
            throw new ArgumentException("合同不存在");
        }

        var approvalChain = contract.Approvals
            .OrderBy(a => a.ApprovedAt)
            .Select(a => new ApprovalChainInfo
            {
                Role = a.Role,
                Name = a.ApprovedByUser.Name,
                ApprovedAt = a.ApprovedAt,
                SignatureData = a.SignatureData
            })
            .ToList();

        var originalPath = contract.OriginalFilePath;
        var finalPath = await AddApprovalChainToPdfAsync(originalPath, approvalChain);

        // 添加所有签名
        foreach (var signature in contract.Signatures)
        {
            if (File.Exists(signature.SignatureImagePath))
            {
                finalPath = await AddSignatureToPdfAsync(finalPath, signature.SignatureImagePath, 
                    signature.PositionX, signature.PositionY, signature.PageNumber);
            }
        }

        contract.FinalFilePath = finalPath;
        contract.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return finalPath;
    }
}
