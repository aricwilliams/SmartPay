using MediatR;

namespace SmartPay.Application.Jobs.Queries;

public record GetJobQuery(Guid JobId) : IRequest<JobResponse>;

public record JobResponse(
    Guid Id,
    string Title,
    string Description,
    Guid ClientId,
    Guid ContractorId,
    decimal TotalAmount,
    string Currency,
    string Status,
    DateTime CreatedAt,
    List<MilestoneResponse> Milestones);

public record MilestoneResponse(
    Guid Id,
    string Title,
    string Description,
    decimal Amount,
    DateTime DueDate,
    string Status);

public class GetJobQueryHandler : IRequestHandler<GetJobQuery, JobResponse>
{
    public async Task<JobResponse> Handle(GetJobQuery request, CancellationToken cancellationToken)
    {
        // Mock implementation - replace with actual repository call
        await Task.Delay(50, cancellationToken);
        
        return new JobResponse(
            request.JobId,
            "Sample Job",
            "Sample job description",
            Guid.NewGuid(),
            Guid.NewGuid(),
            1000m,
            "USD",
            "Active",
            DateTime.UtcNow.AddDays(-1),
            new List<MilestoneResponse>
            {
                new(Guid.NewGuid(), "Milestone 1", "First milestone", 500m, DateTime.UtcNow.AddDays(7), "Pending"),
                new(Guid.NewGuid(), "Milestone 2", "Second milestone", 500m, DateTime.UtcNow.AddDays(14), "Pending")
            });
    }
}