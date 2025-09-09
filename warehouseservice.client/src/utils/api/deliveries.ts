import type { RawShipment } from "../../types/shipments";
import type { Delivery } from "../../components/DeliveryManifest";
import { getDate_Db } from "../helpers/dates";
import { parseErrorMessage } from "./helpers/apiHelpers";

const API_URL = import.meta.env.VITE_API_URL;

interface ApiErrorResponse {
    message: string;
}

export const fetchUnloadPackages = async (bolNumber: string): Promise<RawShipment[]> => {
    try {
        const response: Response = await fetch(`${API_URL}v1/deliveries/${bolNumber}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Unauthorized");
            }
            const errorData: ApiErrorResponse = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
        }

        const data: RawShipment[] = await response.json();
        console.log('Success:', data);
        return data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message.includes("Unauthorized")) {
                alert("log out!!!");
                //await Logout(session);
            }
            console.error('Fetch error:', error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        return [];
    }
};

export interface Manifest {
    undelivered: Delivery[];
    delivered: Delivery[];
    message: string;
}
export const fetchDeliveryManifests = async (powerunit: string, mfstdate: string): Promise<Manifest> => {
    try {
        const dbDate = getDate_Db(mfstdate);
        const response: Response = await fetch(`${API_URL}v1/deliveries?powerunit=${powerunit}&mfstdate=${dbDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            credentials: 'include'
        });
        if (!response.ok) {
            //console.error("Fetching delivery manifests failed on server, logging out.");
            const parsedResponse: {status: number, message: string} = await parseErrorMessage(response);
            throw new Error(`Fetching delivery manifest: [${mfstdate} --- ${powerunit}] failed on server, Status: ${parsedResponse.status} ${parsedResponse.message}`);
        }

        const manifest: Manifest = await response.json();
        return manifest;
    } catch (ex) {
        console.error("Error: ", ex);
        throw ex;
    }
}