namespace WarehouseService.Server.Models.Responses
{
    public class DeliveryManifestResponse
    {
        public string mfstKey { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string lastUpdate { get; set; } = string.Empty;
        public string mfstNumber { get; set; } = string.Empty;
        public string powerUnit { get; set; } = string.Empty;
        public short stop { get; set; } = 0;
        public string mfstDate { get; set; } = string.Empty;
        public string proNumber { get; set; } = string.Empty;
        public string proDate { get; set; } = string.Empty;
        public string shipName { get; set; } = string.Empty;
        public string consName { get; set; } = string.Empty;
        public string consAdd1 { get; set; } = string.Empty;
        public string? consAdd2 { get; set; }
        public string consCity { get; set; } = string.Empty;
        public string consState { get; set; } = string.Empty;
        public string consZip { get; set; } = string.Empty;
        public short ttlPcs { get; set; } = 0;
        public short ttlYds { get; set; } = 0;
        public short ttlWgt { get; set; } = 0;
        public string? dlvdDate { get; set; }
        public string? dlvdTime { get; set; }
        public short? dlvdPcs { get; set; }
        public string? dlvdSign { get; set; }
        public string? dlvdNote { get; set; }
        public string? dlvdImgFileLocn { get; set; }
        public string? dlvdImgFileSign { get; set; }
    }
}
