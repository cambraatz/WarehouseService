namespace WarehouseService.Server.Models.DTO
{
    public class DB_Package
    {
        public string MFSTKEY { get; set; } = string.Empty;
        public string BOLNUM { get; set; } = string.Empty;
        public string ROUTECODE { get; set; } = string.Empty;
        public string PRONUM { get; set; } = string.Empty;
        public string DOORNUM { get; set; } = string.Empty;
        public string BINNUM { get; set; } = string.Empty;
        public string ROLLNUM { get; set; } = string.Empty;
        public string TERMINAL { get; set; } = string.Empty;
        public string SHIPNAME { get; set; } = string.Empty;
        public string CONSNAME { get; set; } = string.Empty;
        public string CONSADD1 { get; set; } = string.Empty;
        public string? CONSADD2 { get; set; }
        public string PRODUCTDESC { get; set; } = string.Empty;
        public short PRODUCTWEIGHT { get; set; }
        public short WIDTH { get; set; }
        public short HEIGHT { get; set; }
    }
}
