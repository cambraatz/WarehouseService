using System.ComponentModel.DataAnnotations;

namespace WarehouseService.Server.Models.Requests
{
    public class DriverVerificationRequest
    {
        [Required(ErrorMessage = "Powerunit is required.")]
        public string POWERUNIT { get; set; } = string.Empty;

        [Required(ErrorMessage = "Username is required.")]
        public string USERNAME { get; set; } = string.Empty;

        [Required(ErrorMessage = "Manifest date is required.")]
        public string MFSTDATE { get; set; } = string.Empty;
    }
}
