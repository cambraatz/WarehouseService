using WarehouseService.Server.Models;
using WarehouseService.Server.Models.DTO;

namespace WarehouseService.Server.Repositories.Interfaces
{
    public interface IDeliveryRepository
    {
        Task<List<DB_Package>> GetPackagesByBolAsync(string bolNumber);
        Task<List<DB_Package>> GetPackagesByMfstKeyAsync(string mfstKey);
        Task<DB_Manifest?> GetFirstDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate);
        Task<List<DB_Manifest>?> GetDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate, string status);
    }
}
