using MediatR;
using Microsoft.Extensions.Logging;

namespace SmartPay.Application.Common.Behaviours;

public sealed class LoggingBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehaviour<TRequest, TResponse>> _logger;

    public LoggingBehaviour(ILogger<LoggingBehaviour<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        
        _logger.LogInformation("SmartPay Request: {Name} {@Request}", requestName, request);
        
        var response = await next();
        
        _logger.LogInformation("SmartPay Response: {Name} {@Response}", requestName, response);
        
        return response;
    }
}