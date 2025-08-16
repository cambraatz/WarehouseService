using WarehouseService.Server.Authorization.Requirements;
using WarehouseService.Server.Models;
using WarehouseService.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WarehouseService.Server.Authorization.Handlers
{
    public class SessionActiveHandler : AuthorizationHandler<SessionActiveRequirement>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISessionService _sessionService;
        private readonly ILogger<SessionActiveHandler> _logger;

        public SessionActiveHandler(
            IHttpContextAccessor httpContextAccessor,
            ISessionService sessionService,
            ILogger<SessionActiveHandler> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _sessionService = sessionService;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SessionActiveRequirement requirement)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
            {
                _logger.LogWarning("SessionActiveHandler: HttpContext is null. Cannot validate session.");
                context.Fail(); // Fail authorization if HttpContext is not available
                return;
            }

            var usernameClaim = context.User.FindFirst(ClaimTypes.Name);
            if (usernameClaim == null || string.IsNullOrEmpty(usernameClaim.Value))
            {
                _logger.LogWarning("SessionActiveHandler: No username claim found in the user context.");
                context.Fail(); // Fail if username is missing from the JWT
                return;
            }

            string username = usernameClaim.Value;

            string? accessToken = httpContext.Request.Cookies["access_token"];
            string? refreshToken = httpContext.Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("SessionActiveHandler: Access token or refresh token missing from cookies for user {Username}.", username);
                context.Fail(); // Fail if required cookies are missing
                return;
            }

            // check to see if session is active in database
            SessionModel? session = await _sessionService.GetSessionAsync(username, accessToken, refreshToken);
            if (session != null)
            {
                _logger.LogDebug("SessionActiveHandler: Active session found in DB for user {Username}, ID: {SessionId}. Updating last activity.", username, session.Id);
                // update last activity timestamp
                await _sessionService.UpdateSessionLastActivityAsync(username, accessToken);
                context.Succeed(requirement); // Succeed if session is active
            }
            else
            {
                _logger.LogWarning("SessionActiveHandler: No matching active session found in DB for user {Username} with provided tokens. Authorization failed.", username);
                context.Fail(); // Fail if no active session record is found
            }
        }
    }
}
