using SmartPay.Services;
using System.Net;

namespace SmartPay.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Add("X-Frame-Options", "DENY");
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            context.Response.Headers.Add("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
            
            // Content Security Policy
            context.Response.Headers.Add("Content-Security-Policy", 
                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'");
            
            // HSTS for HTTPS
            if (context.Request.IsHttps)
            {
                context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            }

            await _next(context);
        }
    }

    public class RateLimitMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ISecurityService _securityService;
        private readonly ILogger<RateLimitMiddleware> _logger;

        public RateLimitMiddleware(RequestDelegate next, ISecurityService securityService, ILogger<RateLimitMiddleware> logger)
        {
            _next = next;
            _securityService = securityService;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ipAddress = GetClientIpAddress(context);
            var endpoint = $"{context.Request.Method}:{context.Request.Path}";
            
            // Different rate limits for different endpoints
            var (maxRequests, window) = GetRateLimitForEndpoint(endpoint);
            
            if (await _securityService.IsRateLimitExceededAsync(ipAddress, endpoint, maxRequests, window))
            {
                context.Response.StatusCode = 429; // Too Many Requests
                context.Response.Headers.Add("Retry-After", window.TotalSeconds.ToString());
                await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
                return;
            }

            await _next(context);
        }

        private string GetClientIpAddress(HttpContext context)
        {
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                return xForwardedFor.Split(',')[0].Trim();
            }

            var xRealIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xRealIp))
            {
                return xRealIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private (int maxRequests, TimeSpan window) GetRateLimitForEndpoint(string endpoint)
        {
            return endpoint.ToLower() switch
            {
                var e when e.Contains("/auth/login") => (5, TimeSpan.FromMinutes(5)), // Strict for login
                var e when e.Contains("/auth/") => (10, TimeSpan.FromMinutes(1)),
                var e when e.Contains("/api/wallets") => (30, TimeSpan.FromMinutes(1)),
                var e when e.Contains("/api/jobs") => (50, TimeSpan.FromMinutes(1)),
                _ => (100, TimeSpan.FromMinutes(1)) // Default
            };
        }
    }

    public class IpWhitelistMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IpWhitelistMiddleware> _logger;
        private readonly HashSet<IPAddress> _allowedIps;

        public IpWhitelistMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<IpWhitelistMiddleware> logger)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
            
            var allowedIpsConfig = _configuration.GetSection("Security:AllowedIps").Get<string[]>() ?? new string[0];
            _allowedIps = new HashSet<IPAddress>();
            
            foreach (var ip in allowedIpsConfig)
            {
                if (IPAddress.TryParse(ip, out var parsedIp))
                {
                    _allowedIps.Add(parsedIp);
                }
            }

            // Always allow localhost for development
            _allowedIps.Add(IPAddress.Loopback);
            _allowedIps.Add(IPAddress.IPv6Loopback);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip whitelist for non-admin endpoints in development
            if (context.Request.Path.StartsWithSegments("/api/admin") && _allowedIps.Count > 2)
            {
                var clientIp = GetClientIpAddress(context);
                
                if (IPAddress.TryParse(clientIp, out var parsedClientIp))
                {
                    if (!_allowedIps.Contains(parsedClientIp))
                    {
                        _logger.LogWarning("Blocked request from non-whitelisted IP: {ClientIP} to {Path}", clientIp, context.Request.Path);
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsync("Access denied: IP not whitelisted");
                        return;
                    }
                }
            }

            await _next(context);
        }

        private string GetClientIpAddress(HttpContext context)
        {
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                return xForwardedFor.Split(',')[0].Trim();
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}