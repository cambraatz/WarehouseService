using WarehouseService.Server.Models;
using WarehouseService.Server.Models.DTO;

namespace WarehouseService.Server.Repositories.Interfaces
{
    public interface IDeliveryRepository
    {
        Task<List<DB_Package>> GetPackagesByBolAsync(string bolNumber);
        Task<DB_Manifest?> GetDeliveryManifestAsync(string powerunit, string manifestDate);
    }
}
