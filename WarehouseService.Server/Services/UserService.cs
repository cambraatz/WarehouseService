using System.Data;
using System.Data.SqlClient;
using WarehouseService.Server.Models;
using WarehouseService.Server.Services.Interfaces;

namespace WarehouseService.Server.Services
{
    public class UserService : IUserService
    {
        private readonly string _connString;
        private readonly ILogger<UserService> _logger;

        public UserService(IConfiguration config, ILogger<UserService> logger)
        {
            _connString = config.GetConnectionString("TCS") ?? throw new InvalidOperationException("TCS connection string is not configured.");
            _logger = logger;
        }

        private async Task<User?> FetchUserAsync(string sqlQuery, Action<SqlParameterCollection> addParams)
        {
            await using var conn = new SqlConnection(_connString);
            await using var comm = new SqlCommand(sqlQuery, conn);
            addParams(comm.Parameters);

            await conn.OpenAsync();
            await using var reader = await comm.ExecuteReaderAsync(CommandBehavior.SingleRow);
            if (!reader.Read()) { return null; }

            var user = new User
            {
                Username = reader["USERNAME"].ToString(),
                Permissions = reader["PERMISSIONS"].ToString(),
                Powerunit = reader["POWERUNIT"].ToString(),
                ActiveCompany = reader["COMPANYKEY01"].ToString(),
                Companies = new(),
                Modules = new()
            };

            for (int i = 1; i <= 5; i++)
            {
                var key = reader[$"COMPANYKEY0{i}"]?.ToString();
                if (!string.IsNullOrEmpty(key))
                {
                    user.Companies.Add(key);
                }
            }

            for (int i = 1; i <= 10; i++)
            {
                var mod = reader[$"MODULE{i:D2}"]?.ToString();
                if (!string.IsNullOrEmpty(mod))
                {
                    user.Modules.Add(mod);
                }
            }

            return user;
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            const string query = @" select USERNAME, PERMISSIONS, POWERUNIT,
                            COMPANYKEY01, COMPANYKEY02, COMPANYKEY03, COMPANYKEY04, COMPANYKEY05,
                            MODULE01, MODULE02, MODULE03, MODULE04, MODULE05, MODULE06, MODULE07, MODULE08, MODULE09, MODULE10
                            from dbo.USERS where USERNAME COLLATE SQL_Latin1_General_CP1_CS_AS = @USERNAME";
            try
            {
                User? user = await FetchUserAsync(query, p => p.AddWithValue("@USERNAME", username));

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error retrieving user '{Username}': {ErrorMessage}", username, ex.Message);
                return null;
            }
        }

        public async Task<bool> IsPowerunitInUseAsync(string powerunit, string username)
        {
            const string query = "select COUNT(*) from dbo.USERS where POWERUNIT=@POWERUNIT and USERNAME != @USERNAME";
            try
            {
                await using var conn = new SqlConnection(_connString);
                await using var comm = new SqlCommand(query, conn);

                comm.Parameters.AddWithValue("@POWERUNIT", powerunit);
                comm.Parameters.AddWithValue("@USERNAME", username);

                await conn.OpenAsync();

                int count = (int)await comm.ExecuteScalarAsync();
                return count > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check powerunit assignment for {Powerunit} by user {Username}.", powerunit, username);
                throw;
            }
        }

        public async Task UpdatePowerunitAsync(string username, string powerunit)
        {
            const string query = "update dbo.USERS set POWERUNIT=@POWERUNIT where USERNAME=@USERNAME";
            try
            {
                await using var conn = new SqlConnection(_connString);
                await using var comm = new SqlCommand(query, conn);

                comm.Parameters.AddWithValue("@USERNAME", username);
                comm.Parameters.AddWithValue("@POWERUNIT", powerunit);

                await conn.OpenAsync();

                await comm.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to assign powerunit {Powerunit} to user {Username}.", powerunit, username);
                throw;
            }
        }
    }
}
