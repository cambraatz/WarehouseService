import { SUCCESS_WAIT, FAIL_WAIT } from "../helpers/macros";
import type { Session } from "../../contexts/AppContext";
import { parseErrorMessage } from "./helpers/apiHelpers";
import { getDate_Db } from "../helpers/dates";
const API_URL = import.meta.env.VITE_API_URL;

function goBackOneDirectory(): string {
    const currPath: string = window.location.pathname;
    if (currPath === "/" || currPath === "") {
        return "/";
    }
    const pathSegments: string[] = currPath.split("/");
    if (pathSegments.length > 0) {
        pathSegments.pop();
    }

    if (pathSegments.length > 1 && pathSegments[pathSegments.length - 1] === "") {
        pathSegments.pop();
    }

    let newPath: string = pathSegments.join("/");
    if (newPath === "") {
        newPath = "/";
    } else if (!newPath.startsWith("/")) {
        newPath = "/" + newPath;
    }

    return newPath;
}

export async function Return(root: boolean, sessionId: string): Promise<string | void> {    
    if (root) {
        try {
            const response = await fetch(`${API_URL}v1/sessions/return/${sessionId}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                credentials: "include"
            });

            if (response.ok) {
                console.log("Return Successful!");
                setTimeout(() => {
                    window.location.href = `https://login.tcsservices.com`;
                }, SUCCESS_WAIT);
            } else {
                console.error("Return cookie generation failed, logging out.");
                await Logout();
                return;
            }
        } catch (error) {
            console.error("An error occurred during the return process:", error);
            await Logout();
        }
    }
    else {
        const path = goBackOneDirectory();
        return path;
    }
}

export async function Logout(session?: Session): Promise<void> {
    localStorage.clear();
    sessionStorage.clear();

    if (session) {
        try {
            const response = await fetch(`${API_URL}v1/sessions/logout/${session.id}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify(session),
                credentials: "include",
            })
            if (response.ok) {
                console.log("Logout Successful!");
                setTimeout(() => {
                    window.location.href = `https://login.tcsservices.com`;
                },SUCCESS_WAIT);
            } else {
                console.error("Cookie removal failed, Logout failure.");
                setTimeout(() => {
                    window.location.href = `https://login.tcsservices.com`;
                },FAIL_WAIT);
            }
        } catch (error) {
            console.error("An error occurred during the logout process:", error);
            setTimeout(() => {
                window.location.href = `https://login.tcsservices.com`;
            },FAIL_WAIT);
        }
    } else {
        setTimeout(() => {
            window.location.href = `https://login.tcsservices.com`;
        },FAIL_WAIT);
    }
}

export interface User {
    Username: string;
    //permissions?: string;
    //powerunit?: string;
    ActiveCompany: string;
    Companies: string[];
    //modules?: string[];
}

export interface ValidationResponse {
    user: User;
    sessionId: string;
    mapping: string;
}

export async function validateSession(): Promise<Response> {
    const response = await fetch(API_URL + "v1/sessions/me", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        credentials: 'include'
    });

    if (!response.ok) {
        console.error(`Session validation failed, Status: ${response.status} ${response.statusText}`);
        try {
            const parsedResponse: {status: number; message: string} = await parseErrorMessage(response);
            console.error(`Validating session failed: Status: ${parsedResponse.status} ${parsedResponse.message}`);
        } catch (ex) {
            console.error(`Error: ${ex}`);
        }
    }

    return response;
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
                code: response.status,
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
        let serverResponse: ManifestAccessServerResponse | null = null;
        let resultMessage: string = "";

        const responseText = await response.text();

        try {
            const body = JSON.parse(responseText);
            serverResponse = body;
            resultMessage = body.message || responseText;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (jsonParseError) {
            resultMessage = await responseText;
        }

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
                console.log("Manifest access granted:", resultMessage);
                return {
                    success: true,
                    message: resultMessage || "Manifest access granted.",
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