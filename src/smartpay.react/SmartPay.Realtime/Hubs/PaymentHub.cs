using Microsoft.AspNetCore.SignalR;

namespace SmartPay.Realtime.Hubs;

public class PaymentHub : Hub
{
    public async Task JoinPaymentGroup(string jobId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"payment-{jobId}");
    }

    public async Task LeavePaymentGroup(string jobId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payment-{jobId}");
    }

    public async Task NotifyPaymentReleased(string jobId, object paymentData)
    {
        await Clients.Group($"payment-{jobId}").SendAsync("PaymentReleased", paymentData);
    }

    public async Task NotifyPaymentEscrowed(string jobId, object paymentData)
    {
        await Clients.Group($"payment-{jobId}").SendAsync("PaymentEscrowed", paymentData);
    }
}