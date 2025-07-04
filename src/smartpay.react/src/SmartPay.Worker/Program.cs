using SmartPay.Worker;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Services.UseSerilog();

// Add HTTP client for external API calls
builder.Services.AddHttpClient();

// Add hosted services
builder.Services.AddHostedService<RankMonitoringService>();
builder.Services.AddHostedService<PaymentProcessingService>();

var host = builder.Build();

await host.RunAsync();