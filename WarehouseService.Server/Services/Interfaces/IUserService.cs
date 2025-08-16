using WarehouseService.Server.Models;

namespace WarehouseService.Server.Services.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<bool> IsPowerunitInUseAsync(string powerunit, string username);
        Task UpdatePowerunitAsync(string username, string powerunit);
    }
}
