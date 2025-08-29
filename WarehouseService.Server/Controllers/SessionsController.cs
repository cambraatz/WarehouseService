using WarehouseService.Server.Models;
//using WarehouseService.Server.Models.Requests;
using WarehouseService.Server.Services;
using WarehouseService.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using System;
using System.Threading.Tasks;
using WarehouseService.Server.Models.Requests;

namespace WarehouseService.Server.Controllers
{
    [ApiController]
    [Route("v1/sessions")]
    public class SessionsController : Controller
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly ISessionService _sessionService;
        private readonly ICookieService _cookieService;
        private readonly IMappingService _mappingService;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SessionsController> _logger;
        public SessionsController(
            IUserService userService,
            ITokenService tokenService,
            ISessionService sessionService,
            ICookieService cookieService,
            IMappingService mappingService,
            IWebHostEnvironment env,
            ILogger<SessionsController> logger)
        {
            _userService = userService;
            _tokenService = tokenService;
            _sessionService = sessionService;
            _cookieService = cookieService;
            _mappingService = mappingService;
            _env = env;
            _logger = logger;
        }

        [HttpGet]
        [Route("dev-login")]
        public async Task<IActionResult> DevLogin(
            [FromQuery] string? username = "cbraatz",
            [FromQuery] string? company = "TCS",
            long sessionId = 0)
        {
            // ensure development environment only...
            if (!_env.IsDevelopment())
            {
                _logger.LogWarning("Attempted to access DevLogin endpoint in non-development environment.");
                return NotFound("This endpoint is only available in the Development environment.");
            }

            // ensure valid username and company parameters...
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(company))
            {
                return BadRequest(new { message = "Username and company are both required for dev login." });
            }

            // generate valid access/refresh tokens for dev session...
            (string access, string refresh) = await _tokenService.GenerateToken(username, sessionId);

            // fetch user credentials from local DB...
            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                _logger.LogWarning("Development user '{Username}' not found in local DB", username);
                return NotFound(new { message = $"Development user '{username}' not found in local database. User must be created prior to login." });
            }

            // Integrate SessionService update for dev-login
            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(refresh);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DevLogin: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            // Add or update the session record in the database
            // Now passing the optional defaultPowerUnit and parsedDefaultMfstDate
            var sessionUpdateSuccess = await _sessionService.AddSessionAsync(
                sessionId,
                username,
                access,
                refresh,
                refreshExpiryTime,
                null, //powerunit, // Pass the defaultPowerUnit parameter
                null //parsedMfstDate.Date // Pass the parsed MfstDate (only date part)
            );
            if (!sessionUpdateSuccess)
            {
                _logger.LogError("DevLogin: Failed to initialize dev session in DB for user {Username}.", username);
                return StatusCode(500, "Failed to initialize dev session in the database.");
            }

            // fetch company and module mappings...
            IDictionary<string, string> companies = await _mappingService.GetCompaniesAsync();
            IDictionary<string, string> modules = await _mappingService.GetModulesAsync();

            /* add max size warning optional */
            Response.Cookies.Append("username", user.Username!, _cookieService.RefreshOptions());
            Response.Cookies.Append("company", company, _cookieService.RefreshOptions());
            Response.Cookies.Append("access_token", access, _cookieService.AccessOptions());
            Response.Cookies.Append("refresh_token", refresh, _cookieService.RefreshOptions());

            Response.Cookies.Append("company_mapping", JsonSerializer.Serialize(companies), _cookieService.RefreshOptions());
            Response.Cookies.Append("module_mapping", JsonSerializer.Serialize(modules), _cookieService.RefreshOptions());

            return Redirect("https://localhost:52379/");
        }

        [HttpGet]
        [Route("me")]
        [Authorize]
        public async Task<IActionResult> ValidateSession()
        {
            string? username = Request.Cookies["username"];
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("ValidateSession: Required 'username' cookie is missing or empty.");
                return BadRequest(new { message = "Username cookies is missing or empty." });
            }

            string? companyMapping = Request.Cookies["company_mapping"];
            if (string.IsNullOrEmpty(companyMapping))
            {
                _logger.LogWarning("ValidateSession: Required 'company_mapping' cookie is missing or empty.");
                return BadRequest(new { message = "Company mapping cookie is missing or empty." });
            }

            string? accessToken = Request.Cookies["access_token"];
            string? refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
            {
                _logger.LogWarning("ValidateSession: Missing required access token cookies for user {Username}.", username);
                return Unauthorized(new { message = "Session access token cookies are missing. Please log in again." });
            }

            // check if user exists in local DB...
            User? user = await _userService.GetByUsernameAsync(username);
            if (user == null)
            {
                _logger.LogWarning("ValidateSession: Failed to fetch user from database.");
                return NotFound(new { message = "Driver not found." });
            }

            // check if session is active in database...
            SessionModel? session = await _sessionService.GetSessionAsync(username, accessToken, refreshToken);
            if (session == null)
            {
                _logger.LogWarning("ValidateSession: Failed to fetch session from database.");
                return Unauthorized(new { message = "Session cookies are missing. Please log in again." });
            }

            return Ok(new
            {
                user = user,
                sessionId = session.Id,
                mapping = companyMapping,
            });
        }

        [HttpPost]
        [Route("check-manifest-access/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> CheckManifestAccess([FromBody] ManifestAccessRequest request, long userId)
        {
            // ensure valid username from token...
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("Attempt to access check-manifest-access without username claim.");
                return Unauthorized(new { message = "User identity not found." });
            }

            // ensure non null date and powerunit values...
            if (string.IsNullOrEmpty(request.PowerUnit) || string.IsNullOrEmpty(request.MfstDate))
            {
                _logger.LogWarning("CheckManifestAccess: Power Unit or Manifest Date (or format issue) missing/invalid for user {Username}. Received PowerUnit: '{PowerUnit}', MfstDateString: '{MfstDateString}'",
                                   username, request.PowerUnit, request.MfstDate);
                return BadRequest(new { message = "Power Unit and Manifest Date are required and must be in 'YYYY-MM-DD' format." });
            }

            var accessToken = Request.Cookies["access_token"];
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken)) {
                _logger.LogWarning("CheckManifestAccess: Missing access or refresh token for user {Username} during manifest session update.", username);
                return Unauthorized(new { message = "Session tokens missing. Please log in again." });
            }

            _logger.LogInformation("CheckManifestAccess: Checking for SSO conflicts for user {Username} on PowerUnit {PowerUnit} and ManifestDate {MfstDate}",
                                   username, request.PowerUnit, request.MfstDate);

            SessionModel? session = await _sessionService.GetConflictingSessionIdAsync(
                    request.PowerUnit,
                    request.MfstDate,
                    userId
                );
            if (session != null)
            {
                // check if the found assigned session is the 'current' user's session...
                bool isCurrSession = 
                        session.Username.Equals(username, StringComparison.OrdinalIgnoreCase) &&
                        session.AccessToken!.Equals(accessToken, StringComparison.OrdinalIgnoreCase) &&
                        session.RefreshToken!.Equals(refreshToken, StringComparison.OrdinalIgnoreCase);
                if (isCurrSession)
                {
                    // NOT A CONFLICT, just confirming the current session is valid in DB...
                    _logger.LogInformation("CheckManifestAccess: User {Username}'s current session (ID: {SessionId}) is already assigned to PowerUnit {PowerUnit} on ManifestDate {MfstDate}.",
                                    username, session.Id, request.PowerUnit, request.MfstDate);
                    return Ok(new { message = "Manifest already assigned to your current session. Access granted.", conflict = false });
                }
                else
                {
                    _logger.LogWarning("SSO conflict detected! PowerUnit {PowerUnit} on ManifestDate {MfstDate} is already assigned to session ID {ConflictingSessionId} (User: {ConflictingUser}). Current user {CurrentUser} is blocked.",
                                   request.PowerUnit, request.MfstDate, session.Id, session.Username, username);
                    if (session.Username.Equals(username, StringComparison.OrdinalIgnoreCase))
                    {
                        // conflict: same user, but different session...
                        return Ok(new
                        {
                            message = $"'{username}') already has active session.",
                            conflict = true,
                            conflictType = "same_user", // Client will look for this
                            conflictingSessionId = session.Id,
                            conflictingSessionUser = session.Username
                        });
                    } else
                    {
                        // conflict: different user, prevent hijacking...
                        return StatusCode(403, new
                        {
                            message = $"Manifest is already in use by another user ({session.Username}).",
                            conflict = true,
                            conflictType = "different_user", // Client will look for this
                            conflictingSessionId = session.Id,
                            conflictingSessionUser = session.Username
                        });
                    }
                }
            }

            DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
            try
            {
                var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(refreshToken);
                if (refreshJwtToken.Payload.Expiration.HasValue)
                {
                    refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", username);
            }

            bool success = await _sessionService.UpdateSessionAsync(
                userId,
                username,
                accessToken,
                refreshToken,
                refreshExpiryTime,
                request.PowerUnit,
                request.MfstDate
            );

            if (!success)
            {
                _logger.LogError("CheckManifestAccess: Failed to update session details for user {Username} with PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                 username, request.PowerUnit, request.MfstDate);
                return StatusCode(500, "Failed to update session with manifest details.");
            }

            _logger.LogInformation("CheckManifestAccess: Manifest access granted and session updated for user {Username} to PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                   username, request.PowerUnit, request.MfstDate);

            return Ok(new { message = "Manifest access granted and session updated." });
        }

        [HttpPost]
        [Route("release-manifest-access/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> ReleaseManifestAccess([FromBody] DriverVerificationRequest request, long userId)
        {
            string message;
            bool success;

            if (request.MFSTDATE != null && request.POWERUNIT != null && request.USERNAME != null)
            {
                // remove conflicting session from db...
                success = await _sessionService.DeleteUserSessionByIdAsync(userId);
                if (!success)
                {
                    _logger.LogError("ReleaseManifestAccess: Failed to release manifest access for user {Username} on PowerUnit {PowerUnit} and ManifestDate {MfstDate}.",
                                     request.USERNAME, request.POWERUNIT, request.MFSTDATE);
                    return StatusCode(500, "Failed to release manifest access.");
                }

                message = success ? "Successfully released previous manifest access."
                    : "Failed to release previous manifest access.";
            }
            else
            {
                // remove powerunit/mfstdate from current session and update tokens...
                var currAccess = Request.Cookies["access_token"];
                var currRefresh = Request.Cookies["refresh_token"];
                if (string.IsNullOrEmpty(currAccess) || string.IsNullOrEmpty(currRefresh))
                {
                    _logger.LogWarning("CheckManifestAccess: Missing access or refresh token for user {Username} during manifest session update.", request.USERNAME);
                    return Unauthorized(new { message = "Session tokens missing. Please log in again." });
                }

                DateTime refreshExpiryTime = DateTime.UtcNow.AddDays(1);
                try
                {
                    var refreshJwtToken = new JwtSecurityTokenHandler().ReadJwtToken(currRefresh);
                    if (refreshJwtToken.Payload.Expiration.HasValue)
                    {
                        refreshExpiryTime = DateTimeOffset.FromUnixTimeSeconds(refreshJwtToken.Payload.Expiration.Value).UtcDateTime;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "CheckManifestAccess: Could not parse refresh token expiry for user {Username}. Using default expiry.", request.USERNAME);
                }

                success = await _sessionService.UpdateSessionAsync(
                    userId,
                    request.USERNAME!,
                    currAccess,
                    currRefresh,
                    refreshExpiryTime,
                    null,
                    null);

                message = success ? "Manifest access granted and session updated."
                    : "Failed to release session with manifest details.";
            }

            if (!success)
            {
                _logger.LogError($"CheckManifestAccess: Failed to release session access for user {request.USERNAME}.");
                return StatusCode(500, message);
            }
            else
            {
                _logger.LogInformation($"ReleaseManifestAccess: Manifest access granted and session updated for user {request.USERNAME}.");
                return Ok(new { message = message });
            }
        }

    }
}
