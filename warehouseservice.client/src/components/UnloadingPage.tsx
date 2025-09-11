import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './Header/Header';
import UnloadMenuWindow from './MenuWindow/BarcodeMenuWindow';
import Footer from './Footer/Footer';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import Popup from './Popup/Popup';
//import BarCodeScan from '../assets/BarcodeScan.png';

import { Logout } from '../utils/api/sessions';
import { useAppContext } from '../contexts/AppContext';
//import type { Session } from '../contexts/AppContext'
import { usePopup } from '../hooks/usePopup';
//import type { PopupType } from './Popup/types/popup';
import { SUCCESS_WAIT, FAIL_WAIT } from '../utils/helpers/macros';

import { fetchPackagesByBOL } from '../utils/api/deliveries';
import type { Shipment } from '../types/shipments';

const UnloadingPage: React.FC = () => {
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
    } = usePopup();

    //const DEFAULT_CODE: string = "XXX-XX-XXXX";
    const [barcode, setBarcode] = useState<string>('');
    const [activeShipment, setActiveShipment] = useState<Shipment | undefined>(undefined);
    //const [packages, setPackages] = useState<RawShipment[]>();

    async function getPackages(bol: string): Promise<Shipment[]> {
        setLoading(true);
        let packageList: Shipment[] = [];
        try {
            const strippedCode = bol.replace(/-/g, '');
            packageList = await fetchPackagesByBOL(strippedCode, session);
        } catch (error: unknown) {
            if (error instanceof Error && error.message === "Unauthorized") {
                console.error("Session expired, logging out...");
                //openPopup("unload_selection_fail");
                openPopup("unauthorized");
                setTimeout(async () => {
                    await Logout(session);
                }, FAIL_WAIT);
            } else {
                console.error("An unexpected error occurred: ", error);
                openPopup("unload_selection_fail");
            }
        } finally {
            setLoading(false);
        }
        return packageList;
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        const packageList: Shipment[] = await getPackages(barcode);
        setSession({
            ...session,
            packageList: packageList
        });

        if (packageList.length > 1) {
            console.log("package list is longer than one: ", packageList);
            navigate(`/unload/${barcode}`);
        } else if (packageList.length == 1) {
            console.log("package list is equal to one: ", packageList);
            setActiveShipment(packageList[0]);
            openPopup("unload_selection");
        } else {
            console.error("package list was not found or is empty.");
            // *** ADD ERROR STYLING TO BARCODE ENTRY WINDOW HERE *** ///
            return;
        }
        //navigate(`/unload/${barcode}`);
        return;
    }

    const handlePopupSubmit = (barcode: string) => {
            console.log(barcode);
            if (activeShipment !== undefined) {
                console.log(`update records for ${activeShipment.mfstKey}`);
                alert(`implement update of records for ${activeShipment.mfstKey}`)
    
                openPopup("unload_selection_success");
                setTimeout(() => {
                    setBarcode('');
                    closePopup();
                }, SUCCESS_WAIT);
            } else {
                //openPopup("unload__selection_fail");
                console.error("update failed with undefined 'activeShipment'");
            }
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
                    root={false}
                />
                <UnloadMenuWindow 
                    prompt="Scan/Enter Freight Barcode"
                    barcode={barcode}
                    setBarcode={setBarcode}
                    handleSubmit={handleSubmit}
                />
                <Footer 
                    classParam="landing_window_footer"
                />
                </>
            )}
            <Popup 
                popupType={popupType}
                isVisible={popupVisible}
                shipment={activeShipment}
                barcode={barcode}
                setBarcode={setBarcode}
                closePopup={closePopup}
                handleBarcodeSubmit={handlePopupSubmit}
            />
        </div>
    )
};

export default UnloadingPage;