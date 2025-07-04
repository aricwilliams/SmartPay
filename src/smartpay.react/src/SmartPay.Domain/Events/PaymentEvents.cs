using MediatR;
using SmartPay.Domain.Entities;

namespace SmartPay.Domain.Events;

public record PaymentReleasedEvent(Milestone Milestone) : INotification;

public record PaymentEscrowedEvent(Guid JobId, Guid MilestoneId, decimal Amount, string Currency) : INotification;

public record PaymentRefundedEvent(Guid JobId, Guid MilestoneId, decimal Amount, string Currency) : INotification;