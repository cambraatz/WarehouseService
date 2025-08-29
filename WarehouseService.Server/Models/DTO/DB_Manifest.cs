namespace WarehouseService.Server.Models.DTO
{
    public class DB_Manifest
    {
        public string MFSTKEY { get; set; } = string.Empty;
        public string STATUS { get; set; } = string.Empty;
        public string LASTUPDATE { get; set; } = string.Empty;
        public string MFSTNUMBER { get; set; } = string.Empty;
        public string POWERUNIT { get; set; } = string.Empty;
        public short STOP { get; set; } = 0;
        public string MFSTDATE { get; set; } = string.Empty;
        public string PRONUMBER { get; set; } = string.Empty;
        public string PRODATE { get; set; } = string.Empty;
        public string SHIPNAME { get; set; } = string.Empty;
        public string CONSNAME { get; set; } = string.Empty;
        public string CONSADD1 { get; set; } = string.Empty;
        public string? CONSADD2 { get; set; }
        public string CONSCITY { get; set; } = string.Empty;
        public string CONSSTATE { get; set; } = string.Empty;
        public string CONSZIP { get; set; } = string.Empty;
        public short TTLPCS { get; set; } = 0;
        public short TTLYDS { get; set; } = 0;
        public short TTLWGT { get; set; } = 0;
        public string? DLVDDATE { get; set; }
        public string? DLVDTIME { get; set; }
        public short? DLVDPCS { get; set; }
        public string? DLVDSIGN { get; set; }
        public string? DLVDNOTE { get; set; }
        public string? DLVDIMGFILELOCN { get; set; }
        public string? DLVDIMGFILESIGN { get; set; }
    }
}
