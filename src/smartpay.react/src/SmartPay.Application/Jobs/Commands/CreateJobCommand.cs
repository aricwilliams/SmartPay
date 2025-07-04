using MediatR;
using SmartPay.Domain.Entities;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Application.Jobs.Commands;

public record CreateJobCommand(
    string Title,
    string Description,
    Guid ClientId,
    Guid ContractorId,
    decimal TotalAmount,
    string Currency,
    List<CreateMilestoneRequest> Milestones) : IRequest<Guid>;

public class CreateJobCommandHandler : IRequestHandler<CreateJobCommand, Guid>
{
    public async Task<Guid> Handle(CreateJobCommand request, CancellationToken cancellationToken)
    {
        var totalAmount = new Money(request.TotalAmount, request.Currency);
        
        var job = new Job(
            request.Title,
            request.Description,
            request.ClientId,
            request.ContractorId,
            totalAmount);

        // Add milestones
        foreach (var milestoneRequest in request.Milestones)
        {
            var milestoneAmount = new Money(milestoneRequest.Amount, request.Currency);
            job.AddMilestone(
                milestoneRequest.Title,
                milestoneRequest.Description,
                milestoneAmount,
                milestoneRequest.DueDate);
        }

        // In real implementation, save to repository
        await Task.Delay(100, cancellationToken);
        
        return job.Id;
    }
}