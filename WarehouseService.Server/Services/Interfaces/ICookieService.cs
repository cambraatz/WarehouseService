using Microsoft.AspNetCore.Http;

namespace WarehouseService.Server.Services.Interfaces
{
    public interface ICookieService
    {
        CookieOptions RemoveOptions();
        CookieOptions AccessOptions();
        CookieOptions RefreshOptions();
        void ExtendCookies(HttpContext context, int extensionMinutes);
    }
}
