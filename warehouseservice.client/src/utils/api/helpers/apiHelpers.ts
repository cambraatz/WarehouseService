export async function parseErrorMessage(
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