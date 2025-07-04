# SmartPay - Smart Payments-as-a-Service API

A modern C# API built with clean architecture principles for handling conditional payments, milestone logic, escrow, and split payouts.

## Architecture Overview

This solution follows Domain-Driven Design (DDD) and Clean Architecture patterns with the following structure:

### Projects

- **SmartPay.Api** - ASP.NET Core Minimal API host
- **SmartPay.Application** - CQRS handlers and business services  
- **SmartPay.Domain** - Domain entities, value objects, and events
- **SmartPay.Infrastructure** - Data persistence and external integrations
- **SmartPay.Realtime** - SignalR hubs for real-time updates
- **SmartPay.Worker** - Background services for monitoring and processing
- **SmartPay.Tests** - Unit and integration tests

### Key Features

- **Conditional Payments** - Rule-based payment logic with IoT integration
- **Multi-Processor Support** - Abstract payment rails (Stripe, Circle, etc.)
- **Secure Wallets** - Tokenized wallet system with escrow support  
- **Real-Time Updates** - SignalR integration for live payment status
- **Rule Engine** - JSON-based conditional logic for payment automation
- **Clean Architecture** - Testable, maintainable, and scalable design

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate and get JWT token |
| POST | `/merchants` | Register new merchant |
| POST | `/jobs` | Create job with milestones |
| PATCH | `/jobs/{id}/evidence` | Submit proof of work |
| GET | `/jobs/{id}` | Get job details and status |
| POST | `/rules` | Define payment conditions |
| POST | `/payments/{jobId}/release` | Release milestone payment |
| GET | `/wallets/{merchantId}` | Get wallet balance and transactions |

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- SQL Server (LocalDB for development)
- Visual Studio 2022 or VS Code

### Setup

1. Clone the repository
2. Update connection string in `appsettings.json`
3. Run database migrations
4. Start the API project

```bash
dotnet run --project src/SmartPay.Api
```

### Testing

Run all tests:
```bash
dotnet test
```

## Payment Flow

1. **Job Creation** - Client creates job with milestones and payment conditions
2. **Escrow** - Funds are held in secure escrow until conditions are met
3. **Rule Evaluation** - Automated checks against IoT data, GPS, approvals, etc.
4. **Payment Release** - Funds released when all conditions satisfied
5. **Real-Time Updates** - Frontend receives instant notifications via SignalR

## Rule Engine

The system supports flexible JSON-based rules:

```json
{
  "name": "GPS Delivery Confirmation",
  "conditions": [
    {
      "type": "location",
      "operator": "within_radius", 
      "value": "100m",
      "description": "Driver within 100m of destination"
    }
  ],
  "actions": [
    {
      "type": "release",
      "parameters": { "percentage": 100 }
    }
  ]
}
```

## Technology Stack

- **Backend**: ASP.NET Core 8, Entity Framework Core, MediatR
- **Database**: SQL Server with EF Core migrations
- **Real-Time**: SignalR for WebSocket communication
- **Testing**: xUnit, FluentAssertions, Moq
- **Logging**: Serilog with structured logging
- **Validation**: FluentValidation with pipeline behaviors

## Security

- JWT-based authentication with refresh tokens
- Role-based authorization (Admin, Operator, Client)
- Secure payment processor integrations
- Data encryption for sensitive information
- Request/response logging and audit trails