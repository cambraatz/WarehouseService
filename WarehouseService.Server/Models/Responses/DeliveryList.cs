namespace WarehouseService.Server.Models.Responses
{
    public class DeliveryListResponse
    {
        public List<DeliveryManifestResponse> undelivered { get; set; } = new List<DeliveryManifestResponse>();
        public List<DeliveryManifestResponse> delivered { get; set; } = new List<DeliveryManifestResponse>();
        public string message { get; set; } = string.Empty;
    }
}
