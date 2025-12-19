using ContractSystem.API.DTOs;
using ContractSystem.Core.Entities;
using ContractSystem.Core.Interfaces;
using ContractSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly ContractDbContext _context;
    private readonly IContractWorkflowService _workflowService;
    private readonly IPdfService _pdfService;
    private readonly IOcrService _ocrService;
    private readonly IWebHostEnvironment _environment;

    public ContractsController(
        ContractDbContext context,
        IContractWorkflowService workflowService,
        IPdfService pdfService,
        IOcrService ocrService,
        IWebHostEnvironment environment)
    {
        _context = context;
        _workflowService = workflowService;
        _pdfService = pdfService;
        _ocrService = ocrService;
        _environment = environment;
    }

    /// <summary>
    /// 获取合同列表
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContractDto>>> GetContracts()
    {
        var contracts = await _context.Contracts
            .Include(c => c.Customer)
            .Include(c => c.CreatedByUser)
            .Include(c => c.Approvals)
            .ThenInclude(a => a.ApprovedByUser)
            .Select(c => new ContractDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                Description = c.Description,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.Name,
                Amount = c.Amount,
                TemplateType = c.TemplateType,
                Status = c.Status,
                CreatedByUserName = c.CreatedByUser.Name,
                CreatedAt = c.CreatedAt,
                Approvals = c.Approvals.Select(a => new ApprovalDto
                {
                    Role = a.Role,
                    ApproverName = a.ApprovedByUser.Name,
                    Action = a.Action,
                    Comments = a.Comments,
                    ApprovedAt = a.ApprovedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(contracts);
    }

    /// <summary>
    /// 获取单个合同
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ContractDto>> GetContract(int id)
    {
        var contract = await _context.Contracts
            .Include(c => c.Customer)
            .Include(c => c.CreatedByUser)
            .Include(c => c.Approvals)
            .ThenInclude(a => a.ApprovedByUser)
            .Where(c => c.Id == id)
            .Select(c => new ContractDto
            {
                Id = c.Id,
                ContractNumber = c.ContractNumber,
                Title = c.Title,
                Description = c.Description,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.Name,
                Amount = c.Amount,
                TemplateType = c.TemplateType,
                Status = c.Status,
                CreatedByUserName = c.CreatedByUser.Name,
                CreatedAt = c.CreatedAt,
                Approvals = c.Approvals.Select(a => new ApprovalDto
                {
                    Role = a.Role,
                    ApproverName = a.ApprovedByUser.Name,
                    Action = a.Action,
                    Comments = a.Comments,
                    ApprovedAt = a.ApprovedAt
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (contract == null)
        {
            return NotFound();
        }

        return Ok(contract);
    }

    /// <summary>
    /// 创建合同
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ContractDto>> CreateContract([FromForm] CreateContractDto dto, [FromForm] IFormFile file)
    {
        // 临时使用userId=1，实际应从JWT Token获取
        int userId = 1;

        // 保存上传的文件
        var uploadPath = Path.Combine(_environment.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var contract = new Contract
        {
            ContractNumber = $"CT{DateTime.UtcNow:yyyyMMddHHmmss}",
            Title = dto.Title,
            Description = dto.Description,
            CustomerId = dto.CustomerId,
            Amount = dto.Amount,
            TemplateType = dto.TemplateType,
            OriginalFilePath = filePath
        };

        var createdContract = await _workflowService.SubmitContractAsync(contract, userId);

        return CreatedAtAction(nameof(GetContract), new { id = createdContract.Id }, createdContract);
    }

    /// <summary>
    /// 审批合同
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult> ApproveContract(int id, [FromBody] ApproveContractDto dto)
    {
        // 临时使用userId=1，实际应从JWT Token获取
        int userId = 1;

        var canApprove = await _workflowService.CanUserApproveContractAsync(id, userId);
        if (!canApprove)
        {
            return Forbid("您没有权限审批此合同");
        }

        var contract = await _workflowService.ApproveContractAsync(id, userId, dto.Action, dto.Comments, dto.SignatureData);

        return Ok(contract);
    }

    /// <summary>
    /// 盖章
    /// </summary>
    [HttpPost("{id}/seal")]
    public async Task<ActionResult> SealContract(int id, [FromBody] string signatureData)
    {
        // 临时使用userId=1，实际应从JWT Token获取
        int userId = 1;

        var contract = await _workflowService.SealContractAsync(id, userId, signatureData);

        // 生成最终合同PDF
        var finalPdfPath = await _pdfService.GenerateFinalContractPdfAsync(id);

        return Ok(new { contract, finalPdfPath });
    }

    /// <summary>
    /// 添加签名到PDF
    /// </summary>
    [HttpPost("{id}/signatures")]
    public async Task<ActionResult> AddSignature(int id, [FromForm] AddSignatureDto dto, [FromForm] IFormFile signatureImage)
    {
        // 临时使用userId=1，实际应从JWT Token获取
        int userId = 1;

        // 保存签名图片
        var uploadPath = Path.Combine(_environment.ContentRootPath, "uploads", "signatures");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var fileName = $"{Guid.NewGuid()}_{signatureImage.FileName}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await signatureImage.CopyToAsync(stream);
        }

        var signature = new Signature
        {
            ContractId = id,
            UserId = userId,
            SignatureImagePath = filePath,
            PositionX = dto.PositionX,
            PositionY = dto.PositionY,
            PageNumber = dto.PageNumber,
            CreatedAt = DateTime.UtcNow
        };

        _context.Signatures.Add(signature);
        await _context.SaveChangesAsync();

        return Ok(signature);
    }

    /// <summary>
    /// 上传客户返回的合同并验证
    /// </summary>
    [HttpPost("{id}/verify")]
    public async Task<ActionResult> VerifyReturnedContract(int id, [FromForm] IFormFile returnedFile)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null)
        {
            return NotFound();
        }

        // 保存客户返回的文件
        var uploadPath = Path.Combine(_environment.ContentRootPath, "uploads", "returned");
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var fileName = $"{Guid.NewGuid()}_{returnedFile.FileName}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await returnedFile.CopyToAsync(stream);
        }

        contract.CustomerReturnedFilePath = filePath;

        // 使用OCR对比
        var comparisonResult = await _ocrService.CompareContractsAsync(contract.FinalFilePath, filePath);

        contract.IsVerified = comparisonResult.IsMatch;
        contract.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            contract, 
            comparison = comparisonResult 
        });
    }

    /// <summary>
    /// 下载合同文件
    /// </summary>
    [HttpGet("{id}/download")]
    public async Task<ActionResult> DownloadContract(int id)
    {
        var contract = await _context.Contracts.FindAsync(id);
        if (contract == null)
        {
            return NotFound();
        }

        var filePath = !string.IsNullOrEmpty(contract.FinalFilePath) 
            ? contract.FinalFilePath 
            : contract.OriginalFilePath;

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound("文件不存在");
        }

        var memory = new MemoryStream();
        using (var stream = new FileStream(filePath, FileMode.Open))
        {
            await stream.CopyToAsync(memory);
        }
        memory.Position = 0;

        return File(memory, "application/pdf", Path.GetFileName(filePath));
    }
}
