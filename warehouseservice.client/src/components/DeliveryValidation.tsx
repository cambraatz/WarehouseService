import React, { useState } from "react"

import Header from "./Header/Header";
import LoadMenuWindow from "./MenuWindow/LoadMenuWindow";
import Footer from "./Footer/Footer";
import Popup from "./Popup/Popup";
import LoadingSpinner from "./LoadingSpinner/LoadingSpinner";

import { useAppContext } from "../contexts/AppContext";
import { usePopup } from "../hooks/usePopup";
import { getDate_Str } from "../utils/helpers/dates";
import { useNavigate } from "react-router-dom";
//import { validateSession, Logout } from "../utils/api/sessions";
import { ValidateAndAssignManifest, releaseManifestAccess, checkManifestAccess, type ApiResult } from "../utils/api/deliveries";
import { FAIL_WAIT } from "../utils/helpers/macros";
import { Logout } from "../utils/api/sessions";
import { validate_dv_form } from "../utils/validation/deliveryValidation";

export interface ValidationForm {
    mfstdate: string;
    powerunit: string;
};

export interface ValidationErrors {
    mfstdate: string;
    powerunit: string;
}

const DeliveryValidation: React.FC = () => {
    const {
        loading, /*setLoading,*/
        session, /*setSession,*/
        loadingSession, setLoadingSession,
    } = useAppContext();

    const {
        popupType, /*setPopupType,*/
        openPopup, closePopup,
        popupVisible, /*setVisible,*/
    } = usePopup();

    const currDate: string = getDate_Str();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<ValidationForm>({
        mfstdate: currDate,
        powerunit: ""
    });

    const DEFAULT_ERRORS = {
        mfstdate: "",
        powerunit: ""
    }
    const [inputErrors, setInputErrors] = useState<ValidationErrors>(DEFAULT_ERRORS);

    const clearStateStyling = () => {
        setInputErrors(DEFAULT_ERRORS)
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        clearStateStyling();
        const id = e.target.id;
        const val = e.target.value;

        switch(true) {
            case id.startsWith("dlvddate"):
                setFormData({
                    ...formData,
                    mfstdate: val
                });
                break;
            case id.startsWith("powerunit"):
                setFormData({
                    ...formData,
                    powerunit: val
                });
                break;
            default:
                break;
        }
    };

    const validateDelivery = async () => {
        const { username, id } = session;
        const { mfstdate, powerunit } = formData;

        try {
            const response: ApiResult = await ValidateAndAssignManifest(
                username,
                powerunit,
                mfstdate,
                id
            );

            if (response.success) {
                setLoadingSession({
                    ...loadingSession,
                    mfstdate: mfstdate,
                    powerunit: powerunit
                });
                navigate("/load/manifest");
                return;
            }

            const release: ApiResult = await releaseManifestAccess(
                session.username,
                formData.powerunit,
                formData.mfstdate,
                session.id);
            if (release.success) {
                setTimeout(() => {
                    clearStateStyling();
                    return;
                }, FAIL_WAIT);
            }
            
            if (response.code === 401 || release.code === 401) {
                const responseError = "Unauthorized attempt, please log in.";
                setInputErrors({
                    mfstdate: responseError,
                    powerunit: responseError
                });

                openPopup("fail");
                setTimeout(async () => {
                    clearStateStyling();
                    await Logout(session);
                    closePopup();
                    return;
                }, FAIL_WAIT);
            }
            else if (response.code === 404 || release.code === 404) {
                const responseError = "No delivery found.";
                setInputErrors({
                    mfstdate: responseError,
                    powerunit: responseError
                });
                setTimeout(async () => {
                    clearStateStyling();
                    return;
                }, FAIL_WAIT);
            }
            else {
                const responseError = "Server error, contact administrator.";
                setInputErrors({
                    mfstdate: responseError,
                    powerunit: responseError
                });
            }
        } catch (err) {
            console.error("Unexpected error during validation:", err);
            setInputErrors({
                mfstdate: "Unexpected error. Try again later.",
                powerunit: "Unexpected error. Try again later.",
            });
        };
    };

    const [conflictID, setConflictID] = useState<number>(-1);
    const handleManifestAccessRequest = async () => {
        // ensure SSO gated access on mfstdate + powerunit...
        const result = await checkManifestAccess(formData.powerunit, formData.mfstdate, session.id);
        if (result.success) {
            console.log("Manifest access granted:", result.message);
        } else {
            console.error("Manifest access check failed:", result.message);
            if (result.conflict) {
                setConflictID(Number(result.conflictingSessionId));
                switch (result.conflictType) {
                    case "same_user":
                        // trigger popup for same-user conflict...
                        console.warn("User already has an active session on this manifest. Presenting option to terminate old session.");
                        openPopup("load_ex_dv_conflict");
                        break;
                    case "different_user":
                        // immediately reject, display an error message to the user...
                        console.error("Manifest is in use by another user. Immediately rejecting.");
                        setInputErrors({
                            mfstdate: result.message,
                            powerunit: result.message
                        });
                        break;
                    default:
                        // fallback for unknown conflict types (shouldn't happen with strict server)...
                        console.error("Unknown conflict type:", result.message);
                        setInputErrors({
                            mfstdate: result.message,
                            powerunit: result.message
                        });
                    }
            } else {
                // handle other non-conflict related errors (e.g., 400, 500, network errors)...
                console.error("Non-conflict error:", result.message);
                setInputErrors({
                    mfstdate: result.message,
                    powerunit: result.message
                });
            }
        }
        // Final styling and state reset
        if (!result.success) {
            setTimeout(() => {
                clearStateStyling();
            }, FAIL_WAIT);
        }
    };

    const releaseSessionAndLogin = async () => {
        const release: ApiResult = await releaseManifestAccess(
            session.username,
            formData.powerunit,
            formData.mfstdate,
            conflictID);
        if (!release.success) {
            setTimeout(() => {
                clearStateStyling();
                return;
            }, FAIL_WAIT);
        }

        await handleManifestAccessRequest();

        await validateDelivery();
    };

    const handleUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // form validation...
        const { isValid, errors, message } = validate_dv_form(formData);
        if (!isValid) {
            console.error("Input validation error:", message);
            setInputErrors(errors);
            return;
        }

        // check for manifest access...
        await handleManifestAccessRequest();
    };

    return (
        <div id="webpage">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                <Header 
                    company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                    title="Warehouse Service"
                    subtitle="Delivery Validation"
                    currUser={session.username}
                    logoutButton={true}
                    root={false}
                />
                <LoadMenuWindow 
                    formData={formData}
                    inputErrors={inputErrors}
                    handleChange={handleChange}
                    handleSubmit={handleUpdate}
                />
                <Footer classParam="validation_window_footer" />
                </>
            )}
            {popupVisible && (
                <Popup 
                    popupType={popupType}
                    isVisible={popupVisible}
                    closePopup={closePopup}
                    handleSubmit={releaseSessionAndLogin}
                />
            )}
        </div>
    )
};

export default DeliveryValidation;