import React, { useState } from 'react';

import Header from './Header/Header';
import DeliveryListWindow from './DeliveryListWindow/DeliveryListWindow';
import Footer from './Footer/Footer';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
import Popup from './Popup/Popup';

import { useAppContext } from '../contexts/AppContext';
import { usePopup } from '../hooks/usePopup';
import type { Shipment } from '../types/shipments';
import { SUCCESS_WAIT } from '../utils/helpers/macros';

const LoadingManifest: React.FC = () => {
    const {
        loading, /*setLoading,*/
        session, /*setSession,*/
    } = useAppContext();

    const {
        openPopup, closePopup,
        popupType, /*setPopupType,*/
        popupVisible, /*setVisible,*/
    } = usePopup();

    //const [shipments,setShipments] = useState<RawShipment[]>(packageList);
    const [activeShipment, setActiveShipment] = useState<Shipment>();
    const [barcode, setBarcode] = useState<string>('');

    const handleClick = (shipment: Shipment) => {
        console.log(shipment.mfstKey);
        setActiveShipment(shipment);
        openPopup("unload_selection");
    };

    const handleSubmit = (barcode: string) => {
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
                    subtitle="Loading Process"
                    currUser={session.username}
                    logoutButton={true}
                    root={false}
                />
                {session.packageList && session.packageList.map((shipment: Shipment) => {
                    return (
                        <DeliveryListWindow 
                            key={shipment.mfstKey}
                            shipment={shipment}
                            handleClick={handleClick}
                        />
                    );
                })}
                <Footer
                    classParam="loading_window_footer"
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
                handleBarcodeSubmit={handleSubmit}
            />
        </div>
    )
};

export default LoadingManifest;