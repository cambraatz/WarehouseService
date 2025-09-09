using WarehouseService.Server.Models;
using WarehouseService.Server.Models.Responses;

namespace WarehouseService.Server.Services.Interfaces
{
    public interface IDeliveryService
    {
        Task<List<Package>> GetPackagesByBolAsync(string bolNumber);
        Task<DeliveryManifestResponse?> GetFirstDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate);
        Task<DeliveryListResponse?> GetDeliveryManifestsAsync(string companyConn, string powerunit, string manifestDate);
    }
}
