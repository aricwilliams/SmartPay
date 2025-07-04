using MediatR;

namespace SmartPay.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;

public record LoginResponse(string Token, string RefreshToken, DateTime ExpiresAt);

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Mock implementation - replace with actual authentication logic
        await Task.Delay(100, cancellationToken);
        
        // In real implementation, validate credentials against database
        if (request.Email == "admin@smartpay.com" && request.Password == "password123")
        {
            return new LoginResponse(
                "mock-jwt-token",
                "mock-refresh-token",
                DateTime.UtcNow.AddHours(1)
            );
        }
        
        throw new UnauthorizedAccessException("Invalid credentials");
    }
}