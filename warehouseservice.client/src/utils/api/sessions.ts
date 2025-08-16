import { SUCCESS_WAIT, FAIL_WAIT } from "../helpers/macros";
import type { Session } from "../../contexts/AppContext";
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

async function parseErrorMessage(
    response: Response
): Promise<{status: number; message: string}> {
    let errorMessage = "An unkonw error occurred";
    let errorType: "unknown" | "json" | "text" | "empty" = "unknown";
    let errorStatus = 0;

    const responseJson = response.clone();
    const responseTxt = response.clone();

    try {
        errorStatus = responseJson.status;
        const errorBody: unknown = await responseJson.json();

        if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "message" in errorBody &&
            typeof (errorBody as { message: unknown }).message === "string"
        ) {
            errorMessage = (errorBody as { message: string }).message;
        } else if (typeof errorBody === "string") {
            errorMessage = errorBody;
        } else {
            errorMessage = `Server error (status: ${responseJson.status}). Details: ${JSON.stringify(errorBody)}`;
        }
    } catch {
        try {
            errorStatus = responseTxt.status;
            const textError = await responseTxt.text();
            if (textError) {
                errorMessage = textError;
            } else {
                errorMessage = `HTTP Error! Status ${responseTxt.status} ${ responseTxt.statusText || "" }`;
            }
            errorType = "text";
        } catch {
            errorMessage = `HTTP Error! Status: ${responseTxt.status} ${responseTxt.statusText || ""} (No response body)`;
            errorType = "empty";
        }
    }

    console.error(`Error (${errorStatus} - ${errorType}):`, errorMessage);
    return { status: errorStatus, message: errorMessage };
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