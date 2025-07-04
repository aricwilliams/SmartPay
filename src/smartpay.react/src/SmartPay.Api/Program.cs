using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using SmartPay.Application.Extensions;
using SmartPay.Infrastructure.Extensions;
using SmartPay.Infrastructure.Persistence;
using SmartPay.Realtime.Extensions;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Add application layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddRealtime();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapAuthEndpoints();
app.MapMerchantEndpoints();
app.MapJobEndpoints();
app.MapPaymentEndpoints();
app.MapWalletEndpoints();
app.MapRuleEndpoints();

// Map SignalR hubs
app.MapRealtime();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SmartPayDbContext>();
    await context.Database.EnsureCreatedAsync();
}

app.Run();

public static class ApiEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/auth").WithTags("Authentication");

        auth.MapPost("/login", async (LoginRequest request, IMediator mediator) =>
        {
            var command = new LoginCommand(request.Email, request.Password);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });

        auth.MapPost("/refresh", async (RefreshTokenRequest request, IMediator mediator) =>
        {
            var command = new RefreshTokenCommand(request.RefreshToken);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });
    }

    public static void MapMerchantEndpoints(this IEndpointRouteBuilder app)
    {
        var merchants = app.MapGroup("/merchants").WithTags("Merchants").RequireAuthorization();

        merchants.MapPost("/", async (CreateMerchantRequest request, IMediator mediator) =>
        {
            var command = new CreateMerchantCommand(request.Name, request.Email, request.BusinessType);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });

        merchants.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var query = new GetMerchantQuery(id);
            var result = await mediator.Send(query);
            return Results.Ok(result);
        });
    }

    public static void MapJobEndpoints(this IEndpointRouteBuilder app)
    {
        var jobs = app.MapGroup("/jobs").WithTags("Jobs").RequireAuthorization();

        jobs.MapPost("/", async (CreateJobRequest request, IMediator mediator) =>
        {
            var command = new CreateJobCommand(
                request.Title,
                request.Description,
                request.ClientId,
                request.ContractorId,
                request.TotalAmount,
                request.Currency,
                request.Milestones);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });

        jobs.MapGet("/{id:guid}", async (Guid id, IMediator mediator) =>
        {
            var query = new GetJobQuery(id);
            var result = await mediator.Send(query);
            return Results.Ok(result);
        });

        jobs.MapPatch("/{id:guid}/evidence", async (Guid id, AddEvidenceRequest request, IMediator mediator) =>
        {
            var command = new AddEvidenceCommand(id, request.MilestoneId, request.EvidenceType, request.Data);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });
    }

    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var payments = app.MapGroup("/payments").WithTags("Payments").RequireAuthorization();

        payments.MapPost("/{jobId:guid}/release", async (Guid jobId, ReleasePaymentRequest request, IMediator mediator) =>
        {
            var command = new ReleasePaymentCommand(jobId, request.MilestoneId);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });
    }

    public static void MapWalletEndpoints(this IEndpointRouteBuilder app)
    {
        var wallets = app.MapGroup("/wallets").WithTags("Wallets").RequireAuthorization();

        wallets.MapGet("/{merchantId:guid}", async (Guid merchantId, IMediator mediator) =>
        {
            var query = new GetWalletQuery(merchantId);
            var result = await mediator.Send(query);
            return Results.Ok(result);
        });
    }

    public static void MapRuleEndpoints(this IEndpointRouteBuilder app)
    {
        var rules = app.MapGroup("/rules").WithTags("Rules").RequireAuthorization();

        rules.MapPost("/", async (CreateRuleRequest request, IMediator mediator) =>
        {
            var command = new CreateRuleCommand(request.Name, request.Description, request.Conditions, request.Actions);
            var result = await mediator.Send(command);
            return Results.Ok(result);
        });
    }
}

// Request DTOs
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record CreateMerchantRequest(string Name, string Email, string BusinessType);
public record CreateJobRequest(string Title, string Description, Guid ClientId, Guid ContractorId, decimal TotalAmount, string Currency, List<CreateMilestoneRequest> Milestones);
public record CreateMilestoneRequest(string Title, string Description, decimal Amount, DateTime DueDate);
public record AddEvidenceRequest(Guid MilestoneId, string EvidenceType, string Data);
public record ReleasePaymentRequest(Guid MilestoneId);
public record CreateRuleRequest(string Name, string Description, List<object> Conditions, List<object> Actions);

// Import necessary command/query classes (these will be defined in Application layer)
using SmartPay.Application.Auth.Commands;
using SmartPay.Application.Merchants.Commands;
using SmartPay.Application.Merchants.Queries;
using SmartPay.Application.Jobs.Commands;
using SmartPay.Application.Jobs.Queries;
using SmartPay.Application.Payments.Commands;
using SmartPay.Application.Wallets.Queries;
using SmartPay.Application.Rules.Commands;