namespace WarehouseService.Server.Models
{
    public class Package
    {
        public string mfstKey { get; set; } = string.Empty;
        public string bolNumber { get; set; } = string.Empty;
        public string routeCode { get; set; } = string.Empty;
        public string proNumber { get; set; } = string.Empty;
        public string doorNumber { get; set; } = string.Empty;
        public string binNumber { get; set; } = string.Empty;
        public string rollNumber { get; set; } = string.Empty;
        public string terminal { get; set; } = string.Empty;
        public string shipper { get; set; } = string.Empty;
        public string consName { get; set; } = string.Empty;
        public string consAdd1 { get; set; } = string.Empty;
        public string? consAdd2 { get; set; }
        public string productDesc { get; set; } = string.Empty;
        public int weight { get; set; }
        public int width { get; set; }
        public int height { get; set; }
    }
}
