using Microsoft.AspNetCore.SignalR;

namespace SmartPay.Realtime.Hubs;

public class JobHub : Hub
{
    public async Task JoinJobGroup(string jobId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"job-{jobId}");
    }

    public async Task LeaveJobGroup(string jobId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job-{jobId}");
    }

    public async Task NotifyJobStatusChanged(string jobId, object statusData)
    {
        await Clients.Group($"job-{jobId}").SendAsync("JobStatusChanged", statusData);
    }

    public async Task NotifyMilestoneCompleted(string jobId, object milestoneData)
    {
        await Clients.Group($"job-{jobId}").SendAsync("MilestoneCompleted", milestoneData);
    }
}