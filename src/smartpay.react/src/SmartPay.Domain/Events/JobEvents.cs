using MediatR;
using SmartPay.Domain.Entities;

namespace SmartPay.Domain.Events;

public record JobCreatedEvent(Job Job) : INotification;

public record JobStatusChangedEvent(Guid JobId, JobStatus NewStatus) : INotification;

public record JobCompletedEvent(Job Job) : INotification;

public record MilestoneStatusChangedEvent(Guid MilestoneId, MilestoneStatus NewStatus) : INotification;

public record MilestoneCompletedEvent(Milestone Milestone) : INotification;

public record EvidenceAddedEvent(Guid MilestoneId, Evidence Evidence) : INotification;