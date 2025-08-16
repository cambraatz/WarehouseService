using WarehouseService.Server.Models;

namespace WarehouseService.Server.Services.Interfaces
{
    public interface ISessionService
    {
        Task<SessionModel?> AddOrUpdateSessionAsync(long userId, string username, string accessToken, string refreshToken, DateTime expiryTime, string? powerUnit, string? mfstDate);
        Task<bool> AddSessionAsync(long userId, string username, string accessToken, string refreshToken, DateTime expiryTime, string? powerUnit, string? mfstDate);
        Task<bool> UpdateSessionAsync(long userId, string username, string accessToken, string refreshToken, DateTime expiryTime, string? powerUnit, string? mfstDate);
        Task<bool> UpdateSessionActivityAsync(long userId);
        Task<bool> UpdateSessionLastActivityAsync(string username, string accessToken);
        Task<bool> UpdateSessionLastActivityByIdAsync(long sessionId);
        Task<SessionModel?> GetSessionAsync(string username, string accessToken, string refreshToken);
        Task<SessionModel?> GetSessionByIdAsync(long userId);
        Task<SessionModel?> GetSessionByManifestDetailsAsync(string username, string powerUnit, string mfstDate, string accessToken, string refreshToken);
        Task<SessionModel?> GetConflictingSessionIdAsync(string powerUnit, string mfstDate, long userId);
        Task<SessionModel?> GetConflictingSessionAsync(string currentUsername, string powerUnit, string mfstDate, string accessToken, string refreshToken);
        Task<bool> DeleteUserSessionByIdAsync(long sessionId);
        Task<bool> InvalidateSessionAsync(string username, string accessToken, string refreshToken);
        Task<bool> InvalidateSessionByTokensAsync(string accessToken, string refreshToken); // For when tokens are revoked externally
        Task<bool> InvalidateSessionByDeliveryManifest(string username, string powerunit, string mfstdate);
        Task<bool> ResetSessionByIdAsync(long userId);
        Task CleanupExpiredSessionsAsync(TimeSpan idleTimeout); // For background cleanup
    }
}
