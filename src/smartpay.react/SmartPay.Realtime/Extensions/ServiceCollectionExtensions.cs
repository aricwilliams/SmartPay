using Microsoft.Extensions.DependencyInjection;
using SmartPay.Realtime.Hubs;

namespace SmartPay.Realtime.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRealtime(this IServiceCollection services)
    {
        services.AddSignalR();
        return services;
    }
}

public static class ApplicationBuilderExtensions
{
    public static void MapRealtime(this Microsoft.AspNetCore.Routing.IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHub<PaymentHub>("/hubs/payments");
        endpoints.MapHub<JobHub>("/hubs/jobs");
    }
}