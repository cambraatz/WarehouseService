import { useState, useCallback } from 'react';
import { SUCCESS_WAIT, FAIL_WAIT } from '../utils/helpers/macros';
import type { PopupType } from '../components/Popup/types/popup';
import { Logout } from '../utils/api/sessions';
import type { Session } from '../contexts/AppContext';

const DEFAULT_POPUP_TYPE: PopupType = "fail";

// define the shape of the returned hook...
interface UsePopupReturn {
    popupType: PopupType;
    setPopupType: React.Dispatch<React.SetStateAction<PopupType>>;
    popupVisible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    openPopup: (type: PopupType) => void;
    closePopup: () => void;
    successPopup: (popupType: PopupType) => void;
    failPopup: (message: string) => void;
    failPopup_logout: (session: Session, message: string) => void;
};

export const usePopup = (): UsePopupReturn => {
    const [popupType,setPopupType] = useState<PopupType>(DEFAULT_POPUP_TYPE);
    const [popupVisible,setVisible] = useState<boolean>(false);

    const openPopup = useCallback((type: PopupType) => {
        setPopupType(type);
        setVisible(true);
    }, [])

    const closePopup = useCallback(() => {
        setVisible(false);
        setPopupType(DEFAULT_POPUP_TYPE);
    }, [])

    const successPopup = useCallback((popupType: PopupType) => {
        setPopupType(popupType);
        setVisible(true);
        setTimeout(() => {
            setVisible(false);
        }, SUCCESS_WAIT);
    }, [])

    const failPopup = useCallback((message: string) => {
        console.error(message);
        openPopup("fail");
        setTimeout(() => {
            setVisible(false);
        }, FAIL_WAIT);
    }, [openPopup])

    const failPopup_logout = useCallback((session: Session, message: string) => {
        console.error(message);
        openPopup("fail");
        setTimeout(async () => {
            await Logout(session);
            closePopup();
            return;
        }, FAIL_WAIT)

    }, [closePopup, openPopup]);

    return { 
        popupType, setPopupType,
        popupVisible, setVisible,
        openPopup, closePopup,
        successPopup, failPopup, failPopup_logout
    };
}