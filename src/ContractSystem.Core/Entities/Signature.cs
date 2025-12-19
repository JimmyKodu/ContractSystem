namespace ContractSystem.Core.Entities;

/// <summary>
/// 签名实体 - 用于PDF上可拖动的签名定位
/// </summary>
public class Signature
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public string SignatureImagePath { get; set; } = string.Empty;
    public float PositionX { get; set; }
    public float PositionY { get; set; }
    public int PageNumber { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Contract Contract { get; set; } = null!;
    public User User { get; set; } = null!;
}
