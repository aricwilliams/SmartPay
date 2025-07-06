namespace SmartPay.Models.DTOS
{
    public record JobCreateDto(
       string Title,
       string Description,
       string Client,
       string Contractor,
       decimal TotalAmount,
       string Currency,
       IReadOnlyList<MilestoneCreateDto> Milestones);

    public record MilestoneCreateDto(
        string Title,
        string Description,
        decimal Amount,
        DateTime DueDate);

}
