using SmartPay.Domain.Common;

namespace SmartPay.Domain.Entities;

public class Evidence : BaseEntity
{
    public EvidenceType Type { get; private set; }
    public string Data { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public DateTime Timestamp { get; private set; }
    public string Hash { get; private set; } = string.Empty;

    private Evidence() { } // EF Core

    public Evidence(EvidenceType type, string data, string description)
    {
        Type = type;
        Data = data;
        Description = description;
        Timestamp = DateTime.UtcNow;
        Hash = ComputeHash(data);
    }

    private static string ComputeHash(string data)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hash = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hash);
    }

    public bool VerifyIntegrity()
    {
        return Hash == ComputeHash(Data);
    }
}

public enum EvidenceType
{
    Photo,
    Document,
    GPS,
    Signature,
    Video,
    IoTSensor
}