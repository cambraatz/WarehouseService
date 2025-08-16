using WarehouseService.Server.Services.Interfaces; // Your ISessionService
using Microsoft.Extensions.DependencyInjection; // For IServiceScopeFactory
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace WarehouseService.Server.BackgroundServices
{
    public class SessionCleanupHostedService : IHostedService, IDisposable
    {
        private Timer? _timer;
        private readonly ILogger<SessionCleanupHostedService> _logger;
        private readonly IServiceScopeFactory _scopeFactory; // To get a scoped ISessionService instance

        // Configuration for the cleanup
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(5); // How often to run the cleanup
        private readonly TimeSpan _idleSessionTimeout = TimeSpan.FromMinutes(15); // How long before a session is considered idle

        public SessionCleanupHostedService(ILogger<SessionCleanupHostedService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Session Cleanup Hosted Service running.");

            // Start the timer immediately and then repeat at the cleanup interval
            _timer = new Timer(DoWork, null, TimeSpan.Zero, _cleanupInterval);

            return Task.CompletedTask;
        }

        private async void DoWork(object? state)
        {
            _logger.LogDebug("Session cleanup task initiated.");
            // Create a new scope for the database operation
            // This is important because ISessionService is often scoped per request,
            // but a hosted service runs independently.
            using (var scope = _scopeFactory.CreateScope())
            {
                var sessionService = scope.ServiceProvider.GetRequiredService<ISessionService>();
                try
                {
                    await sessionService.CleanupExpiredSessionsAsync(_idleSessionTimeout);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred during session cleanup in hosted service.");
                }
            }
            _logger.LogDebug("Session cleanup task completed.");
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Session Cleanup Hosted Service is stopping.");

            _timer?.Change(Timeout.Infinite, 0); // Stop the timer
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}