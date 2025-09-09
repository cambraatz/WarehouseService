using WarehouseService.Server.Models;
using WarehouseService.Server.Models.Requests;
using WarehouseService.Server.Models.Responses;
using WarehouseService.Server.Services;
using WarehouseService.Server.Services.Interfaces;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Data;
using System.Data.SqlClient;
using System.Text.Json;

namespace WarehouseService.Server.Controllers
{
    [ApiController]
    [Route("v1/deliveries")]
    public class DeliveryController : Controller
    {
        private readonly IConfiguration _config;
        private readonly IHostEnvironment _env;
        private readonly IUserService _userService;
        private readonly IDeliveryService _deliveryService;
        private readonly ISessionService _sessionService;
        private readonly ICookieService _cookieService;
        private readonly ILogger<DeliveryController> _logger;
        private readonly string _connString;

        public DeliveryController(
            IConfiguration config,
            IHostEnvironment env,
            IUserService userService,
            IDeliveryService deliveryService,
            ISessionService sessionService,
            ICookieService cookieService,
            ILogger<DeliveryController> logger)
        {
            _config = config;
            _env = env;
            _userService = userService;
            _deliveryService = deliveryService;
            _sessionService = sessionService;
            _cookieService = cookieService;
            _logger = logger;
            _connString = _config.GetConnectionString("TCS")!;
        }

        // ["v1/deliveries/validate-and-assign/{userId}"] validate and assign a powerunit/mfstdate to a user session...
        [HttpPost]
        [Route("validate-and-assign/{userId}")]
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> ValidateAndAssignManifest([FromBody] DriverVerificationRequest request, long userId)
        { 
            // validate request parameters...
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Validation failed for DriverVerificationRequest: {Errors}", ModelState);
                return BadRequest(ModelState);
            }

            string currUsername = request.USERNAME;
            //string currUsername = User.Identity.USERNAME;

            try
            {
                // update users powerunit in user DB...
                await _userService.UpdatePowerunitAsync(currUsername, request.POWERUNIT);
                _logger.LogInformation("USER '{Username}' successfully assigned powerunit '{Powerunit}'.", currUsername, request.POWERUNIT);

                // retrieve active company from cookies...
                var company = Request.Cookies["company"];
                if (string.IsNullOrEmpty(company))
                {
                    _logger.LogWarning("Company key cookies is missing for user '{Username}' during manifest verification.", currUsername);
                    return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
                }

                // fetch connection string of active company...
                string companyConnString = _config.GetConnectionString(company)!;
                if (string.IsNullOrEmpty(companyConnString))
                {
                    _logger.LogError("Connection string for company '{Company}' not found in configuration.", company);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Server configuration error: Connection string for company '{company}' not found, contact system administrator." });
                }

                var accessToken = Request.Cookies["access_token"];

                // update driver session...
                await _sessionService.UpdateSessionActivityAsync(userId);
                _logger.LogDebug("Session last activity updates for user {Username}", currUsername);

                // attempt to retrieve first matching delivery manifest...
                DeliveryManifestResponse? manifest = await _deliveryService.GetFirstDeliveryManifestAsync(companyConnString, request.POWERUNIT, request.MFSTDATE);
                if (manifest != null)
                {
                    _logger.LogInformation($"Valid delivery manifest found for powerunit '{request.POWERUNIT}' on date '{request.MFSTDATE}' for company '{company}'.");
                    return Ok(new { message = "Valid date/powerunit combination was found.", manifest = manifest });
                }
                else
                {
                    _logger.LogInformation("No matching delivery manifest found for powerunit '{Powerunit}' and date '{ManifestDate}'.", request.POWERUNIT, request.MFSTDATE);
                    return NotFound(new { message = "Invalid date/powerunit combination. No matching delivery manifests found for the provided details." });
                }
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, "An unexpected error occurred during delivery manifest validation and assignment for user '{Username}', powerunit '{Powerunit}', date '{ManifestDate}'.", currUsername, request.POWERUNIT, request.MFSTDATE);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An internal server error occurred while processing your request. Please try again later.", details = ex.Message });
            }
        }


        // ["v1/deliveries/{bolNumber}"] fetches deliveries by bill of lading number...
        [HttpGet("{bolNumber}")]
        [Authorize]
        public async Task<IActionResult> GetPackageList(string bolNumber)
        {
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid input for BOL number: {BolNum}", bolNumber);
                return BadRequest(ModelState);
            }

            try
            {
                var packages = await _deliveryService.GetPackagesByBolAsync(bolNumber);
                if (packages == null || !packages.Any())
                {
                    _logger.LogInformation("No deliveries found for BOL number: {BolNum}", bolNumber);
                    return NotFound("No packages found for the provided bill of lading number.");
                }

                return Ok(packages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching packages for BOL: {BolNumber}", bolNumber);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        private string GetMessage(int undelivered, int delivered)
        {
            if (undelivered > 0 && delivered > 0)
            {
                return "Both tables returned non-null values";
            }
            if (undelivered == 0 && delivered > 0)
            {
                return "Delivered returned non-null values, no valid undelivered records.";
            }
            if (delivered == 0 && undelivered > 0)
            {
                return "Undelivered returned non-null values, no valid delivered records.";
            }

            return "No valid records were found.";
        }

        // ["v1/deliveries/{powerunit}{mfstdate}"] fetches deliveries by bill of lading number...
        [HttpGet] 
        [Authorize(Policy = "SessionActive")]
        public async Task<IActionResult> GetDeliveries([FromQuery] string powerunit, [FromQuery] string mfstdate)
        {
            // ensure non-null parameters...
            if (string.IsNullOrEmpty(powerunit) || string.IsNullOrEmpty(mfstdate))
            {
                _logger.LogWarning("Powerunit and Manifest Date are required to fetch deliveries.");
                return BadRequest(new { message = "Powerunit and Manifest Date are required." });
            }

            // retrieve active company from cookies...
            var company = Request.Cookies["company"];
            if (string.IsNullOrEmpty(company))
            {
                _logger.LogWarning("Company key cookies is missing while attempting to fetch delivery manifests, for powerunit '{Powerunit}' and date '{ManifestDate}'.", powerunit, mfstdate);
                return BadRequest(new { message = "Company context is missing from your session. Please ensure you are logged in correctly." });
            }

            string companyConnString = _config.GetConnectionString(company)!;
            if (string.IsNullOrEmpty(companyConnString))
            {
                throw new Exception($"Server configuration error: Connection string for company '{company}' not found, contact system administrator.");
            }

            // ensure non-null parameters...
            var username = Request.Cookies["username"];
            if (string.IsNullOrEmpty(username))
            {
                _logger.LogWarning("USername is required to fetch deliveries.");
                return BadRequest(new { message = "Username are required." });
            }

            var accessToken = Request.Cookies["access_token"];
            //var refreshToken = Request.Cookies["refresh_token"];

            // update driver session...
            await _sessionService.UpdateSessionLastActivityAsync(username, accessToken!);
            _logger.LogDebug("Session last activity updated for user {Username}.", username);

            try
            {
                DeliveryListResponse? manifests = await _deliveryService.GetDeliveryManifestsAsync(companyConnString, powerunit, mfstdate);

                if (manifests == null)
                {
                    throw new Exception("Fetching manifests returned null results.");
                }

                string responseMessage = GetMessage(manifests.undelivered.Count, manifests.delivered.Count);
                manifests.message = responseMessage;

                _logger.LogInformation("Successfully retrieved {UndeliveredCount} undelivered and {DeliveredCount} delivered manifests for Powerunit: '{Powerunit}', Date: '{ManifestDate}'.", manifests.undelivered.Count, manifests.delivered.Count, powerunit, mfstdate);
                return Ok(manifests);
            }
            catch (Exception ex)
            {
                string errorMessage = string.IsNullOrEmpty(ex.Message)
                    ? "An internal server error occurred while retrieving deliveries. Please try again later."
                    : ex.Message;

                _logger.LogError(ex, "An unexpected error occurred while fetching deliveries for powerunit '{Powerunit}', date '{ManifestDate}'. Error: {ErrorMessage}", powerunit, mfstdate, ex.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "An internal server error occurred while retrieving deliveries. Please try again later.",
                    details = errorMessage
                });
            }
        }
    }
}
