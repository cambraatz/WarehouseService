using WarehouseService.Server.Models;
using WarehouseService.Server.Services.Interfaces;
using WarehouseService.Server.Repositories.Interfaces;
using WarehouseService.Server.Models.DTO;
using WarehouseService.Server.Models.Responses;

namespace WarehouseService.Server.Services
{
    public class DeliveryService : IDeliveryService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<DeliveryService> _logger;
        private readonly IDeliveryRepository _deliveryRepo;

        public DeliveryService(
            IConfiguration config,
            ILogger<DeliveryService> logger,
            IDeliveryRepository deliveryRepo)
        {
            _config = config;
            _logger = logger;
            _deliveryRepo = deliveryRepo;
        }

        public async Task<List<Package>> GetPackagesByBolAsync(string bolNumber)
        {
            if (string.IsNullOrWhiteSpace(bolNumber) || bolNumber.Length != 9)
            {
                return new List<Package>();
            }

            List<DB_Package> packages = await _deliveryRepo.GetPackagesByBolAsync(bolNumber);
            List<Package> mappedPackages = packages.Select(p => new Package
            {
                mfstKey = p.MFSTKEY,
                bolNumber = p.BOLNUM,
                routeCode = p.ROUTECODE,
                proNumber = p.PRONUM,
                doorNumber = p.DOORNUM,
                binNumber = p.BINNUM,
                rollNumber = p.ROLLNUM,
                terminal = p.TERMINAL,
                shipper = p.SHIPNAME,
                consName = p.CONSNAME,
                consAdd1 = p.CONSADD1,
                consAdd2 = p.CONSADD2,
                productDesc = p.PRODUCTDESC,
                weight = p.PRODUCTWEIGHT,
                width = p.WIDTH,
                height = p.HEIGHT
            }).ToList();

            return mappedPackages;
        }

        public async Task<DeliveryManifestResponse?> GetFirstDeliveryManifestAsync(string companyConn, string powerunit, string manifestDate)
        {
            // reject improper parameter data...
            if (string.IsNullOrEmpty(powerunit) || string.IsNullOrEmpty(manifestDate))
            {
                return null;
            }

            // fetch manifest from db repo...
            var dbManifest = await _deliveryRepo.GetFirstDeliveryManifestAsync(companyConn, powerunit, manifestDate);
            if (dbManifest == null)
            {
                return null;
            }

            var manifest = new DeliveryManifestResponse
            {
                mfstKey = dbManifest.MFSTKEY,
                status = dbManifest.STATUS,
                lastUpdate = dbManifest.LASTUPDATE,
                mfstNumber = dbManifest.MFSTNUMBER,
                powerUnit = dbManifest.POWERUNIT,
                stop = dbManifest.STOP,
                mfstDate = dbManifest.MFSTDATE,
                proNumber = dbManifest.PRONUMBER,
                proDate = dbManifest.PRODATE,
                shipName = dbManifest.SHIPNAME,
                consName = dbManifest.CONSNAME,
                consAdd1 = dbManifest.CONSADD1,
                consAdd2 = dbManifest.CONSADD2,
                consCity = dbManifest.CONSCITY,
                consState = dbManifest.CONSSTATE,
                consZip = dbManifest.CONSZIP,
                ttlPcs = dbManifest.TTLPCS,
                ttlYds = dbManifest.TTLYDS,
                ttlWgt = dbManifest.TTLWGT,
                dlvdDate = dbManifest.DLVDDATE,
                dlvdTime = dbManifest.DLVDTIME,
                dlvdPcs = dbManifest.DLVDPCS,
                dlvdSign = dbManifest.DLVDSIGN,
                dlvdNote = dbManifest.DLVDNOTE,
                dlvdImgFileLocn = dbManifest.DLVDIMGFILELOCN,
                dlvdImgFileSign = dbManifest.DLVDIMGFILESIGN
            };

            return manifest;
        }

        public async Task<DeliveryListResponse?> GetDeliveryManifestsAsync(
            string companyConn,
            string powerunit,
            string manifestDate)
        {
            if (string.IsNullOrEmpty(companyConn) || string.IsNullOrEmpty(powerunit) || string.IsNullOrEmpty(manifestDate))
            {
                return null;
            }

            List<DB_Manifest>? dbUndelivered = await _deliveryRepo.GetDeliveryManifestAsync(companyConn, powerunit, manifestDate, "0");
            List<DB_Manifest>? dbDelivered = await _deliveryRepo.GetDeliveryManifestAsync(companyConn, powerunit, manifestDate, "1");
            if (dbUndelivered == null || dbDelivered == null)
            {
                return null;
            }

            var undelivered = new List<DeliveryManifestResponse>();
            var delivered = new List<DeliveryManifestResponse>();
            var manifest = new DeliveryManifestResponse();

            foreach (DB_Manifest dbManifest in dbUndelivered)
            {
                manifest = new DeliveryManifestResponse
                {
                    mfstKey = dbManifest.MFSTKEY,
                    status = dbManifest.STATUS,
                    lastUpdate = dbManifest.LASTUPDATE,
                    mfstNumber = dbManifest.MFSTNUMBER,
                    powerUnit = dbManifest.POWERUNIT,
                    stop = dbManifest.STOP,
                    mfstDate = dbManifest.MFSTDATE,
                    proNumber = dbManifest.PRONUMBER,
                    proDate = dbManifest.PRODATE,
                    shipName = dbManifest.SHIPNAME,
                    consName = dbManifest.CONSNAME,
                    consAdd1 = dbManifest.CONSADD1,
                    consAdd2 = dbManifest.CONSADD2,
                    consCity = dbManifest.CONSCITY,
                    consState = dbManifest.CONSSTATE,
                    consZip = dbManifest.CONSZIP,
                    ttlPcs = dbManifest.TTLPCS,
                    ttlYds = dbManifest.TTLYDS,
                    ttlWgt = dbManifest.TTLWGT,
                    dlvdDate = dbManifest.DLVDDATE,
                    dlvdTime = dbManifest.DLVDTIME,
                    dlvdPcs = dbManifest.DLVDPCS,
                    dlvdSign = dbManifest.DLVDSIGN,
                    dlvdNote = dbManifest.DLVDNOTE,
                    dlvdImgFileLocn = dbManifest.DLVDIMGFILELOCN,
                    dlvdImgFileSign = dbManifest.DLVDIMGFILESIGN
                };
                undelivered.Add(manifest);
            }

            foreach (DB_Manifest dbManifest in dbDelivered)
            {
                manifest = new DeliveryManifestResponse
                {
                    mfstKey = dbManifest.MFSTKEY,
                    status = dbManifest.STATUS,
                    lastUpdate = dbManifest.LASTUPDATE,
                    mfstNumber = dbManifest.MFSTNUMBER,
                    powerUnit = dbManifest.POWERUNIT,
                    stop = dbManifest.STOP,
                    mfstDate = dbManifest.MFSTDATE,
                    proNumber = dbManifest.PRONUMBER,
                    proDate = dbManifest.PRODATE,
                    shipName = dbManifest.SHIPNAME,
                    consName = dbManifest.CONSNAME,
                    consAdd1 = dbManifest.CONSADD1,
                    consAdd2 = dbManifest.CONSADD2,
                    consCity = dbManifest.CONSCITY,
                    consState = dbManifest.CONSSTATE,
                    consZip = dbManifest.CONSZIP,
                    ttlPcs = dbManifest.TTLPCS,
                    ttlYds = dbManifest.TTLYDS,
                    ttlWgt = dbManifest.TTLWGT,
                    dlvdDate = dbManifest.DLVDDATE,
                    dlvdTime = dbManifest.DLVDTIME,
                    dlvdPcs = dbManifest.DLVDPCS,
                    dlvdSign = dbManifest.DLVDSIGN,
                    dlvdNote = dbManifest.DLVDNOTE,
                    dlvdImgFileLocn = dbManifest.DLVDIMGFILELOCN,
                    dlvdImgFileSign = dbManifest.DLVDIMGFILESIGN
                };
                delivered.Add(manifest);
            }

            var manifests = new DeliveryListResponse
            {
                undelivered = undelivered,
                delivered = delivered
            };

            return manifests;
        }
    }
}
