using WarehouseService.Server.Models;
using WarehouseService.Server.Models.DTO;
using WarehouseService.Server.Repositories.Interfaces;
using Dapper;
using System.Data.SqlClient;

namespace WarehouseService.Server.Repositories
{
    public class DeliveryRepository : IDeliveryRepository
    {
        private readonly IConfiguration _config;
        private readonly ILogger<DeliveryRepository> _logger;
        private readonly string _connString;

        public DeliveryRepository(IConfiguration config, ILogger<DeliveryRepository> logger)
        {
            _config = config;
            _logger = logger;
            _connString = _config.GetConnectionString("TCS") ??
                throw new InvalidOperationException("TCS connection string is not configured.");
        }

        public async Task<List<DB_Package>> GetPackagesByBolAsync(string bolNumber)
        {
            const string query = "SELECT * FROM dbo.TEMPDELIVERY WHERE BOLNUM = @BolNum;";

            using (var conn = new SqlConnection(_connString))
            {
                try
                {
                    var packages = await conn.QueryAsync<DB_Package>(query, new { BolNum = bolNumber });
                    return packages.ToList();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error retrieving packages for BOL: {BolNum}", bolNumber);
                    throw;
                }
            }
        }

        public async Task<DB_Manifest?> GetDeliveryManifestAsync(string powerunit, string manifestDate)
        {
            const string query = "SELECT * FROM dbo.DMFSTDAT WHERE MFSTDATE = @MfstDate AND POWERUNIT = @PowerUnit";

            using (var conn = new SqlConnection(_connString))
            {
                try
                {
                    var manifest = await conn.QueryFirstOrDefaultAsync<DB_Manifest>(query, new { MfstDate = manifestDate, PowerUnit = powerunit });
                    return manifest;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error retrieving delivery manifest for MfstDate: {mfstDate} and PowerUnit: {powerunit}", manifestDate, powerunit);
                    throw;
                }
            }
        }
    }
}
