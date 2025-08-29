import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header/Header';
//import MenuWindow from './MenuWindow/MenuWindow';
import ListWindow from './ListWindow/ListWindow';
import Footer from './Footer/Footer';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';
//import Popup from './Popup/Popup';

import { useAppContext } from '../contexts/AppContext';
//import type { Session } from '../contexts/AppContext';
//import { Logout } from '../utils/api/sessions';
//import { FAIL_WAIT } from '../utils/helpers/macros';
import {fetchDeliveryManifests, type DeliveryManifest }  from '../utils/api/deliveries';
//import type { Session } from 'react-router-dom';
import { usePopup } from '../hooks/usePopup';
//import type { PopupType } from '../types/popup';

export interface Delivery {
    mfstKey: string;
    status: string;
    lastUpdate: string;
    mfstNumber: string;
    powerUnit: string;
    stop: number; // Corresponds to C# short
    mfstDate: string;
    proNumber: string;
    proDate: string;
    shipName: string;
    consName: string;
    consAdd1: string;
    consAdd2: string | null;
    consCity: string;
    consState: string;
    consZip: string;
    ttlPcs: number;
    ttlYds: number;
    ttlWgt: number;
    dlvdDate: string | null;
    dlvdTime: string | null;
    dlvdPcs: number | null;
    dlvdSign: string | null;
    dlvdNote: string | null;
    dlvdImgFileLocn: string | null;
    dlvdImgFileSign: string | null;
}

export interface DeliveryManifestState {
    [key: string]: Delivery[];
}

const LoadingManifest: React.FC = () => {
    const {
        loading, setLoading,
        session, /*setSession,*/
        loadingSession, setLoadingSession
    } = useAppContext();

    const {
        /*openPopup, closePopup,
        popupType, setPopupType,
        popupVisible, setVisible,*/
        failPopup_logout
    } = usePopup();

    const navigate = useNavigate();

    const [undelivered, setUndelivered] = useState<DeliveryManifestState>();
    const [delivered, setDelivered] = useState<DeliveryManifestState>();

    // split delivery manifest into render format...
    const packageDeliveries = (deliveries: Delivery[], allowDuplicates: boolean): DeliveryManifestState => {
        const sharedAddress = (a: Delivery, b: Delivery): boolean => {
            if (a.consAdd1 === b.consAdd1 && a.consAdd2 === b.consAdd2) { return true; }
            return false;
        };

        let i: number = 0;
        let currDelivery: Delivery | undefined = undefined; // 'sticks' to first delivery at each unique address...
        const packagedDeliveries: DeliveryManifestState = {};

        while (i < deliveries.length) {
            // when allowed, group deliveries whose addresses are shared...
            if (currDelivery && sharedAddress(deliveries[i], currDelivery) && allowDuplicates) {
                const sharedDeliveries: Delivery[] = [currDelivery]; // initialize new array of shared deliveries...
                while (i < deliveries.length && sharedAddress(deliveries[i], currDelivery)) {
                    sharedDeliveries.push(deliveries[i]);
                    i += 1;
                }
                packagedDeliveries[currDelivery.stop] = sharedDeliveries;
            } 
            // catch delivered | unique addresses | unallowed duplicates...
            else {
                currDelivery = deliveries[i];
                packagedDeliveries[deliveries[i].stop] = [ deliveries[i] ];
                i += 1;
            }
        }
        return packagedDeliveries;
    }

    const failPopup_memo = useCallback(async (message: string) => {
        failPopup_logout(session, message);
    }, [session, failPopup_logout]);

    // query all deliveries matching the provided delivery details...
    const getDeliveries = useCallback(async (powerunit: string, mfstdate: string) => {
        // attempt to gather deliveries...
        try {
            const manifest: DeliveryManifest = await fetchDeliveryManifests(powerunit, mfstdate);
            // parse deliveries into render-ready form...
            const undelivered: DeliveryManifestState = packageDeliveries(manifest.undelivered, false);
            const delivered: DeliveryManifestState = packageDeliveries(manifest.delivered, false);
            
            // set state values...
            setUndelivered(undelivered);
            setDelivered(delivered);
            return;
        } catch (error) {
            console.error(error);
        }

        failPopup_memo("fetching deliveries getDeliveries failed, logging out.");
    }, [failPopup_memo]);

    useEffect(() => {
        const isSessionInvalid = () => {
            return (
                !session.username ||
                !session.company ||
                !loadingSession.mfstdate ||
                !loadingSession.powerunit
            );
        };
        setLoading(true);
        if (isSessionInvalid()) {
            failPopup_memo("Loading manifest session validation failed.");
        };

        getDeliveries(session.powerunit!, session.mfstdate!);
        setLoading(false);
    }, [session, loadingSession, getDeliveries, failPopup_memo, setLoading]);

    const selectDelivery = (deliveries: DeliveryManifestState, proNumber: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, list] of Object.entries(deliveries)) {
            for (const delivery of list) {
                if (delivery.proNumber === proNumber) {
                    //const deliveryData = { stopNum: stopNum, delivery: delivery };
                    setLoadingSession({
                        ...loadingSession,
                        activeDelivery: delivery
                    });
                    navigate(`/load/manifest/${delivery.proNumber}`/*, {state: deliveryData}*/ );
                    return;
                }
            }
        }
        console.error(`delivery ${proNumber} was not found in delivery list...`);
    };

    return (
        <div id="webpage">
            {(loading || !undelivered || !delivered) ? ( <LoadingSpinner /> ) : (
                <>
                <Header 
                    company={session.company ? session.company.split(' ') : ["Transportation", "Computer", "Support", "LLC."]}
                    title="Warehouse Service"
                    subtitle="Delivery Manifest"
                    currUser={session.username}
                    logoutButton={true}
                    root={false}
                />
                <ListWindow 
                    mfstDate={loadingSession.mfstdate}
                    powerUnit={loadingSession.powerunit}
                    renderSubheader={true}
                    status="Undelivered"
                    deliveries={undelivered}
                    selectDelivery={selectDelivery}
                />
                <ListWindow 
                    mfstDate={undefined}
                    powerUnit={undefined}
                    renderSubheader={false}
                    status="Delivered"
                    deliveries={delivered}
                    selectDelivery={selectDelivery}
                />
                <Footer
                    classParam="loading_window_footer"
                />
                </>
            )}
        </div>
    )
};

export default LoadingManifest;