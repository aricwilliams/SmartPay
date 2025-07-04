using MediatR;
using SmartPay.Domain.Entities;
using SmartPay.Domain.ValueObjects;

namespace SmartPay.Domain.Events;

public record WalletCreatedEvent(Wallet Wallet) : INotification;

public record WalletBalanceChangedEvent(Guid WalletId, Money NewBalance) : INotification;