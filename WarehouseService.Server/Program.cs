using WarehouseService.Server.Services;
using WarehouseService.Server.Services.Interfaces;
using WarehouseService.Server.Models;
using WarehouseService.Server.Authorization.Requirements;
using WarehouseService.Server.Authorization.Handlers;

using Newtonsoft.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;

// token initialization...
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using Serilog;
using Microsoft.AspNetCore.Authorization;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog to read from appsettings.json
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Optional: Add a simple log message here to confirm Serilog initialized
Log.Information("Application startup. Serilog initialized from configuration. Environment: {EnvironmentName}", builder.Environment.EnvironmentName);
Log.Debug("This is a test debug message to confirm verbose logging is active.");

if (builder.Environment.IsProduction())
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(6500);
    });

    // new modification to CORS package...
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(name: MyAllowSpecificOrigins,
            policy =>
            {
                policy.SetIsOriginAllowed(origin => new Uri(origin).Host.EndsWith("tcsservices.com"))
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });
}
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(name: MyAllowSpecificOrigins,
            policy =>
            {
                policy.WithOrigins("https://localhost:52379")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });
}

// Add services to the container.
//builder.Services.AddControllers();

// Adding Serializers, this is a new attempt...
// JSON Serializer
builder.Services.AddControllers().AddNewtonsoftJson(options =>
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore).AddNewtonsoftJson(
    options => options.SerializerSettings.ContractResolver = new DefaultContractResolver());


// token initialization...
//var jwtKey = Environment.GetEnvironmentVariable("Jwt__Key") ?? builder.Configuration["Jwt:Key"];
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],

            ValidateAudience = true,
            AudienceValidator = (audiencesInToken, securityToken, validationParameters) =>
            {
                // These are the values your app *expects* from its configuration
                string expectedAudience = builder.Configuration["Jwt:Audience"]!; // Should be "localhost:5173"
                string expectedIssuer = builder.Configuration["Jwt:Issuer"]!;     // Should be "localhost:7242"

                // This list contains the audiences YOUR APP considers valid for an incoming token
                var allowedAudiencesForThisApp = new List<string>
                {
                    expectedAudience,
                    expectedIssuer
                };

                bool hasValidAudience = audiencesInToken.Intersect(allowedAudiencesForThisApp, StringComparer.OrdinalIgnoreCase).Any();

                return hasValidAudience;
            },

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ClockSkew = TimeSpan.Zero,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Try to read the token from the "access_token" cookie
                if (context.Request.Cookies.ContainsKey("access_token"))
                {
                    context.Token = context.Request.Cookies["access_token"];
                }
                // If not found in cookie, you could also check headers (default behavior)
                // Or prioritize cookies if that's your primary method
                else if (context.Request.Headers.ContainsKey("Authorization"))
                {
                    // If it's in the header, make sure it's a "Bearer " token
                    string authorizationHeader = context.Request.Headers["Authorization"];
                    if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Token = authorizationHeader.Substring("Bearer ".Length).Trim();
                    }
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                // Log full exception for detailed debugging
                //_logger.LogError(context.Exception, "JWT Authentication failed.");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"Token validated successfully for user: {context.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SessionActive", policy =>
        policy.Requirements.Add(new SessionActiveRequirement()));
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICookieService, CookieService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMappingService, MappingService>();
builder.Services.AddScoped<ISessionService, SessionService>();

builder.Services.AddHttpContextAccessor();

builder.Services.AddHostedService<WarehouseService.Server.BackgroundServices.SessionCleanupHostedService>();

builder.Services.AddScoped<IAuthorizationHandler, SessionActiveHandler>();

var app = builder.Build();

// Error Handling (very early)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Only in Dev
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Forwarded Headers (if behind a proxy like Nginx in Production)
if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
}

app.UseHttpsRedirection(); // Redirects HTTP to HTTPS

// Swagger UI (typically before Routing in Development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting(); // Identifies endpoints

// CORS (after UseRouting, before Auth/AuthZ)
app.UseCors(MyAllowSpecificOrigins);

// Cookie Policy (usually before Auth)
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
    HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always,
    Secure = app.Environment.IsProduction() || (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Kestrel:Certificates:Default:Password:IsTrusted", false))
        ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest
});

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Static Files for the SPA
app.UseDefaultFiles(); // Serves default.html, index.html etc. for the SPA
app.UseStaticFiles(); // Serves JS, CSS, images etc. for the SPA

app.MapControllers(); // Maps your API controller endpoints

// Fallback for SPA routing (must be last)
app.MapFallbackToFile("/index.html");

app.Run();
