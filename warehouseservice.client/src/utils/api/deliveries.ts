import type { RawShipment } from "../../types/shipments";
import type { Delivery } from "../../components/LoadingManifest";
import { getDate_Db } from "../helpers/dates";

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
            console.error('Fetch error:', error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
        return [];
    }
};

export interface DeliveryManifest {
    undelivered: Delivery[];
    delivered: Delivery[];
    message: string;
}
export const fetchDeliveryManifests = async (powerunit: string, mfstdate: string): Promise<DeliveryManifest> => {
    try {
        const response: Response = await fetch(`${API_URL}v1/deliveries?powerunit="${powerunit}&mfstdate=${mfstdate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            credentials: 'include'
        });
        if (!response.ok) {
            console.error("Fetching delivery manifests failed on server, logging out.");
            const parsedResponse: {status: number, message: string} = await parseErrorMessage(response);
            throw new Error(`Fetching delivery manifest: [${mfstdate} --- ${powerunit}] failed on server, Status: ${parsedResponse.status} ${parsedResponse.message}`);
        }

        const manifest: DeliveryManifest = await response.json();
        return manifest;
    } catch (ex) {
        console.error("Error: ", ex);
        throw ex;
    }
}

export interface ApiResult {
    success: boolean;
    message: string;
    code?: number;
};

type ValidateManifestPayload = {
    USERNAME: string;
    POWERUNIT: string;
    MFSTDATE: string;
};

export async function ValidateAndAssignManifest(
    username: string,
    powerunit: string,
    mfstdate: string,
    userId: number
): Promise<ApiResult> {
    try {
        const response: Response = await fetch(`${API_URL}v1/deliveries/validate-and-assign/${userId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=UTF-8"
                },
                credentials: "include",
                body: JSON.stringify({
                    USERNAME: username,
                    POWERUNIT: powerunit,
                    MFSTDATE: getDate_Db(mfstdate),
                } as ValidateManifestPayload),
            }
        );

        const responseText = await response.text();

        if (response.ok) {
            console.log(`Delivery validation successful for ${powerunit} and ${mfstdate}`);
            return {
                success: true,
                message: responseText,
                code: response.status
            };
        } else {
            console.error(`Delivery validation failed for ${powerunit} and ${mfstdate}`);
            return {
                success: false,
                message: `Error (${response.status}): ${responseText}`,
                code: response.status,
            };
        }
    } catch (err: unknown) {
        console.error("Error during validateAndAssignManifest:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            message: `Network or unexpected error: ${errorMessage}`,
            code: 500,
        };
    }
}

async function parseErrorMessage(response: Response): Promise<{ status: number, message: string }> {
    // The response body can only be consumed once, so we'll try to get it
    // as text first, which will be available regardless of the content type.
    const textBody = await response.text();
    const status = response.status;
    let errorMessage = `HTTP Error! Status: ${status} ${response.statusText || ''}`;
    
    // Check for a non-empty body and a valid status code to avoid
    // unnecessary JSON parsing attempts.
    if (textBody) {
        try {
            // Attempt to parse the body as JSON.
            const jsonBody = JSON.parse(textBody);
            
            // Check for a 'message' property or if the body itself is a string.
            if (jsonBody && typeof jsonBody === 'object' && jsonBody.message) {
                errorMessage = jsonBody.message;
            } else if (typeof jsonBody === 'string') {
                errorMessage = jsonBody;
            } else {
                // If the body is a different type of object, stringify it for the message.
                errorMessage = `Server error (status: ${status}). Details: ${JSON.stringify(jsonBody)}`;
            }
            
            console.error(`Error (${status} - json):`, errorMessage);

        } catch (jsonParseError) {
            // If JSON parsing fails, the body must be plain text.
            errorMessage = textBody;
            console.error(`Error (${status} - text):`, errorMessage);
        }
    } else {
        // If there's no body, use a default message.
        console.error(`Error (${status} - empty):`, errorMessage);
    }

    return { status, message: errorMessage };
}

async function parseResponseForMessage(response: Response): Promise<{ message: string, parsedBody: any }> {
    try {
        const parsedBody = await response.json();
        return { message: parsedBody.message || JSON.stringify(parsedBody), parsedBody };
    } catch {
        const text = await response.text();
        return { message: text, parsedBody: null };
    }
}

export interface ManifestAccessServerResponse {
    message?: string;
    conflict?: boolean;
    conflictType?: "same_user" | "different_user" | "current_session" | "unknown";
    conflictingSessionId?: string;
    conflictingSessionUser?: string;
}

export interface CheckManifestResult extends ApiResult {
    conflict: boolean;
    conflictType?: "same_user" | "different_user" | "current_session" | "unknown";
    conflictingSessionId?: string;
    conflictingSessionUser?: string;
}

export async function checkManifestAccess(
    powerunit: string,
    mfstdate: string,
    userId: number
): Promise<CheckManifestResult> {
    try {
        const response: Response = await fetch(
            `${API_URL}v1/sessions/check-manifest-access/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    powerunit: powerunit,
                    mfstdate: getDate_Db(mfstdate)
                }),
                credentials: "include",
            }
        );

        const statusCode = response.status;
        const { message: resultMessage, parsedBody: serverResponseJson } = await parseResponseForMessage(response);
        const serverResponse: ManifestAccessServerResponse = serverResponseJson;

        if (response.ok) {
            console.log("Server's 200 OK JSON response:", serverResponse);

            if (serverResponse && serverResponse.conflict) {
                // handle same user conflict...
                if (serverResponse.conflictType === "same_user") {
                    console.warn("Same user conflict detected. Server message:", serverResponse.message);
                    return {
                        success: false,
                        message: serverResponse.message || "Same user conflict occurred.",
                        code: statusCode,
                        conflict: true,
                        conflictType: "same_user",
                        conflictingSessionId: serverResponse.conflictingSessionId,
                        conflictingSessionUser: serverResponse.conflictingSessionUser
                    };
                } else {
                    // Unexpected conflict type with 200 OK status.
                    console.error("Unexpected conflict type with 200 OK status. Server message:", serverResponse.message);
                    return {
                        success: false,
                        message: serverResponse.message || "An unexpected conflict occurred.",
                        code: statusCode,
                        conflict: true,
                        conflictType: "unknown"
                    };
                }
            } else {
                // no conflict, or 'current_session' type, which is a successful access..
                console.log("Manifest access granted:", serverResponse.message);
                return {
                    success: true,
                    message: serverResponse.message || "Manifest access granted.",
                    code: statusCode,
                    conflict: false
                };
            }
        } else { // handle not ok (non-200)...
            console.error(`Failed to check manifest access: ${statusCode}`);
            console.error("Error message from server:", resultMessage);

            const conflictType = serverResponse?.conflictType || "unknown";
            const conflictingSessionId = serverResponse?.conflictingSessionId;
            const conflictingSessionUser = serverResponse?.conflictingSessionUser;
            let finalMessage = resultMessage;

            switch (statusCode) {
                case 400:
                    finalMessage = finalMessage || "Invalid request. Please check your input.";
                    break;
                case 401:
                    finalMessage = "Session expired or unauthorized. Please log in again.";
                    console.error("Unauthorized: Session expired. Redirecting to login.");
                    break;
                case 403:
                    if (conflictType === "different_user") {
                        finalMessage = finalMessage || "Access denied. Manifest is in use by another user.";
                    } else {
                        finalMessage = finalMessage || "Access denied. You do not have permission to perform this action.";
                    }
                    break;
                case 404:
                    finalMessage = finalMessage || "Resource not found.";
                    break;
                case 409:
                    finalMessage = finalMessage || "A conflict occurred. The resource might be in use.";
                    break;
                case 500:
                    finalMessage = finalMessage || "An internal server error occurred. Please try again later.";
                    break;
                default:
                    finalMessage = finalMessage || `Error (${statusCode}): An unexpected status code was received.`;
            }

            return {
                success: false,
                message: finalMessage,
                code: statusCode,
                conflict: true,
                conflictType: conflictType,
                conflictingSessionId: conflictingSessionId,
                conflictingSessionUser: conflictingSessionUser
            };
        }
    } catch (err: unknown) {
        console.error("Error during checkManifestAccess:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            message: `Network or unexpected error: ${errorMessage}`,
            code: 500,
            conflict: false
        };
    }
}

export async function releaseManifestAccess(
    username: string,
    powerunit: string | null = null,
    mfstdate: string | null = null,
    userId: number
): Promise<ApiResult> {
    try {
        const response: Response = await fetch(
            `${API_URL}v1/sessions/release-manifest-access/${userId}`,
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    powerunit,
                    mfstdate: mfstdate ? getDate_Db(mfstdate) : null,
                }),
            }
        );

        if (response.ok) {
            const result = await response.json();
            console.log("Manifest released successfuly:", result.message);
            return { success: true, message: result.message, code: response.status };
        } else {
            const errorText = await response.text();
            console.error("Failed to release manifest access:", response.status, errorText);
            return {
                success: false,
                message: `Error (${response.status}): ${errorText}`,
                code: response.status,
            };
        }
    } catch (err: unknown) {
        console.error("Network or unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            message: `Network error: ${errorMessage}`,
            code: 500,
        }
    }
};

