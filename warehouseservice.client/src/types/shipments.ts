export interface Shipment {
    mfstKey: string;
    bolNumber: string;
    routeCode: string;
    proNumber: string;
    doorNumber: string;
    binNumber: string;
    rollNumber: string;
    terminal: number;
    shipper: string;
    consName: string;
    consAdd1: string;
    consAdd2?: string;
    productDesc: string;
    weight: number;
    width: number;
    height: number;
}