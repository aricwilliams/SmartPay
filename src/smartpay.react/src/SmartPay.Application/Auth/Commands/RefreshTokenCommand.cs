using MediatR;

namespace SmartPay.Application.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<LoginResponse>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResponse>
{
    public async Task<LoginResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Mock implementation - replace with actual token refresh logic
        await Task.Delay(50, cancellationToken);
        
        return new LoginResponse(
            "new-jwt-token",
            "new-refresh-token",
            DateTime.UtcNow.AddHours(1)
        );
    }
}