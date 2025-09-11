import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './Header/Header';
import MenuWindow from './MenuWindow/MenuWindow';
import Footer from './Footer/Footer';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import Popup from './Popup/Popup';

import { validateSession, Logout } from '../utils/api/sessions';
//import { useAppContext } from '../hooks/useAppContext';
//import type { Session } from '../contexts/AppContext'
import { useAppContext, type Session } from '../contexts/AppContext';
import { usePopup } from '../hooks/usePopup';
import type { PopupType } from './Popup/types/popup';
//import { FAIL_WAIT } from '../utils/helpers/macros';

const WarehouseLanding: React.FC = () => {
    const navigate = useNavigate();

    // context types should be inferenced from AppContext hook...
    const {
        loading, setLoading,
        session, setSession,
    } = useAppContext();

    const {
        openPopup, closePopup,
        popupType, /*setPopupType,*/
        popupVisible, /*setVisible,*/
        failPopup_logout,
    } = usePopup();

    useEffect(() => {
        validateUserSession(
            setLoading,
            session,
            setSession,
            openPopup,
            closePopup,
            failPopup_logout,
            Logout,
            validateSession
        );
    }, [])

    interface User {
        Username: string;
        //permissions?: string;
        Powerunit?: string;
        ActiveCompany: string;
        Companies?: string[];
        //modules?: string[];
    }

    interface ValidationResponse {
        user: User;
        sessionId: string;
        mapping: string;
    }

    // validate session and establish state data...
    async function validateUserSession(
        setLoading: (loading: boolean) => void,
        session: Session,
        setSession: (session: Session) => void,
        openPopup: (type: PopupType) => void,
        closePopup: () => void,
        failPopup_logout: (session: Session, message: string) => void,
        Logout: (session?: Session) => void,
        validateSession: () => Promise<Response>,
    ): Promise<void> {
        setLoading(true);
        try {
            const response = await validateSession();

            if (response.ok) {
                const data: ValidationResponse = await response.json();
                console.log(data);

                const username: string = data.user.Username;
                const powerunit: string | undefined = data.user.Powerunit;
                const companyMap: Record<string, string> = JSON.parse(data.mapping);
                const companyName: string = companyMap[data.user.ActiveCompany];
                const sessionId: string = data.sessionId;

                setSession({
                    ...session,
                    username: username,
                    id: Number(sessionId),
                    company: companyName,
                    powerunit: powerunit,
                });

                setLoading(false);
                return;
            } else {
                await failPopup_logout(session, "Sesion validation failed, logging out.");
            }
        } catch (error) {
            console.error("Failed to validate session:", error);
            await failPopup_logout(session, "Sesion validation failed, logging out.");
        } finally {
            setLoading(false);
        }
    }

    function pressButton(target: string): void {
        if (target === "unload") {
            console.log("UNLOAD!");
            //openPopup("unload");
            navigate('/unload');
        } else {
            navigate('/load');
        }
    }

    function handleSubmit(value: string): void {
        console.log(`submitting: ${value}`);
        navigate(`/unload/${value}`);
    }

    return (
        <div id="webpage">
            {loading ? ( <LoadingSpinner /> ) : (
                <>
                <Header 
                    company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                    title="Warehouse Service"
                    subtitle="Unload/Load Guide"
                    currUser={session.username}
                    logoutButton={true}
                    root={true}
                />
                <MenuWindow
                    prompt="What would you like to do?"
                    pressButton={pressButton}
                />
                <Footer 
                    classParam="landing_window_footer"
                />
                </>
            )}
            <Popup 
                popupType={popupType}
                isVisible={popupVisible}
                closePopup={closePopup}
                handleBarcodeSubmit={handleSubmit}
            />
        </div>
    )
};

export default WarehouseLanding;