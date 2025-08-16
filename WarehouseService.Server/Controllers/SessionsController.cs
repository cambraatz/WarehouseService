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
    }
}
