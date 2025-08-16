import React, { useEffect } from 'react';
import Header from './Header/Header';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import Popup from './Popup/Popup';
import Footer from './Footer/Footer';

import { validateSession, Logout } from '../utils/api/sessions';
import { useAppContext } from '../hooks/useAppContext';
import type { Session } from '../contexts/AppContext'
import { usePopup } from '../hooks/usePopup';
import type { PopupType } from '../types/popup';

import { FAIL_WAIT } from '../utils/helpers/macros';
import MenuWindow from './MenuWindow/MenuWindow';

const WarehouseLanding: React.FC = () => {
    // context types should be inferenced from AppContext hook...
    const {
        loading, setLoading,
        session, setSession,
    } = useAppContext();

    const {
        openPopup, closePopup,
        popupType, /*setPopupType,*/
        popupVisible, /*setVisible,*/
    } = usePopup();

    useEffect(() => {
        validateUserSession(
            setLoading,
            session,
            setSession,
            openPopup,
            closePopup,
            Logout,
            validateSession
        );
    }, [])

    interface User {
        Username: string;
        //permissions?: string;
        //powerunit?: string;
        ActiveCompany: string;
        Companies: string[];
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
                const sessionId: string = data.sessionId;
                const companyMap: Record<string, string> = JSON.parse(data.mapping);
                const companyName: string = companyMap[data.user.ActiveCompany];

                setSession({
                    ...session,
                    username: username,
                    id: Number(sessionId),
                    company: companyName,
                })

                setLoading(false);
                return;
            } else {
                openPopup("fail");
                setTimeout(() => {
                    Logout(session);
                    console.error("LOGOUT!");
                    closePopup();
                }, FAIL_WAIT);
            }
        } catch (error) {
            console.error("Failed to validate session:", error);
            openPopup("fail");
            setTimeout(() => {
                Logout(session);
                console.error("LOGOUT!");
                closePopup();
            }, FAIL_WAIT);
        } finally {
            setLoading(false);
        }
    }

    function pressButton(target: string): void {
        if (target === "unload") {
            console.log("UNLOAD!");
            openPopup("unload");
        } else {
            console.log("LOAD!");
            openPopup("load");
        }
    }

    function handleSubmit(value: string): void {
        console.log(`submitting: ${value}`);
    }

    return (
        <div id="webpage">
            {loading ? (
                <LoadingSpinner />
            ) : (
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
                handleSubmit={handleSubmit}
            />
        </div>
    )
};

export default WarehouseLanding;