using System.Globalization;
using System.ComponentModel.DataAnnotations;

namespace WarehouseService.Server.Models.Requests
{
    public class ManifestAccessRequest
    {
        [Required(ErrorMessage = "Powerunit is required.")]
        public string PowerUnit { get; set; } = string.Empty;

        [Required(ErrorMessage = "Manifest date is required.")]
        public string MfstDate { get; set; } = string.Empty;
    }
}
