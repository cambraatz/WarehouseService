import React, { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PopupType } from './types/popup';
import BarCodeScan from '../../assets/BarcodeScan.png';
import Success_Image from '../../assets/success.svg';
import Fail_Image from '../../assets/error.svg';
import './Popup.css';
import type { RawShipment } from '../../types/shipments';

interface PopupProps {
    popupType: PopupType;
    isVisible: boolean;
    shipment?: RawShipment;
    barcode?: string;
    setBarcode?: Dispatch<SetStateAction<string>>;
    closePopup: () => void;
    handleSubmit: (barcode: string) => void;
}

const Popup: React.FC<PopupProps> = ({ 
    popupType,
    isVisible,
    shipment,
    barcode,
    setBarcode,
    closePopup,
    handleSubmit
}) => {
    // establish ref to input on popup...
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const typesToFocus = ['unload', 'unload_selection'];
        if (isVisible && 
            typesToFocus.includes(popupType) && 
            inputRef.current) {
            setTimeout(() => {
                inputRef.current!.focus();
            }, 500);
        }

        /*if (isVisible && setBarcode) {
            setBarcode('');
        }*/
    }, [isVisible, popupType]);

    const DEFAULT_CODE: string = "XXX-XX-XXXX";
    //const [barcode, setBarcode] = useState<string>('');

    const handleUnloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (setBarcode) {
            const rawValue = e.target.value;
            // reject non-numeric values...
            const numericValue = rawValue.replace(/[^A-Za-z0-9]/g, '');

            // ensure XXX-XX-XXXX format...
            let formattedValue = '';
            if (numericValue.length > 0) {
                formattedValue = numericValue.substring(0,3);
            }
            if (numericValue.length > 3) {
                formattedValue += `-${numericValue.substring(3,5)}`;
            }
            if (numericValue.length > 5) {
                formattedValue += `-${numericValue.substring(5,9)}`;
            }
            setBarcode(formattedValue);
        }
    };

    const handleUnloadSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ensure unload popup is open and valid barcode...
        if (setBarcode && barcode.replace(/[^A-Za-z0-9]/g, '').length === 9) {
            handleSubmit(barcode);
            setBarcode('');
            closePopup();
        } else {
            console.log('Invalid barcode format. Please check the value.');
        }
    };

    const handleUnloadSelectionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // ensure unload popup is open and valid barcode...
        if (popupType === "unload_selection") {
            handleSubmit(barcode);
        } else {
            console.log('Invalid barcode format. Please check the value.');
        }
    }

    const popupContent = (): React.ReactNode => {
        if (popupType === "unload" && setBarcode) {
            return (
                <div className="popupPrompt">
                    <img id="barcode_scan_image" src={BarCodeScan} alt="barcode scanner image" />
                    <p>Scan/Enter Freight Barcode</p>
                    <div className="barcode_input_div">
                        <form onSubmit={handleUnloadSubmit}>
                            <input
                                type="text"
                                id="barcode_input"
                                placeholder={DEFAULT_CODE}
                                value={barcode}
                                ref={inputRef}
                                onChange={handleUnloadChange}
                            />
                            <div className="unload_button_div">
                                <button type="submit">Submit</button>
                                <button type="button" onClick={() => setBarcode(DEFAULT_CODE)}>Reset</button>
                            </div>
                        </form>
                        
                    </div>
                </div>
            )
        } else if (popupType === "unload_selection") {
            if (shipment === undefined || !setBarcode) {
                console.error("shipment is undefined, something went wrong.");
                closePopup();
                return;
            }
            return (
                <figure className="popup_unload_selection">
                    <div className="popup_unload_selection_header">
                        <h5>{shipment.routeCode}</h5>
                        <div className="popup_unload_selection_double_col">
                            <h4 className="weak">{shipment.consAdd1}</h4>
                            {shipment.consAdd2 && (
                                <h4 className="weak">{shipment.consAdd2}</h4>
                            )}
                        </div>
                    </div>
                    <div className="popup_unload_selection_body">
                        <img id="barcode_scan_image" src={BarCodeScan} alt="barcode scanner image" />
                        <p>Scan/Enter Bin Location Code</p>
                        <div className="barcode_input_div">
                            <form onSubmit={handleUnloadSelectionSubmit}>
                                <input
                                    type="text"
                                    id="barcode_input"
                                    placeholder={DEFAULT_CODE}
                                    value={barcode}
                                    ref={inputRef}
                                    onChange={handleUnloadChange}
                                />
                                <div className="unload_button_div">
                                    <button type="submit">Submit</button>
                                    <button type="button" onClick={() => setBarcode(DEFAULT_CODE)}>Reset</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </figure>          
            )
        } else if (popupType === "unload_selection_success" || popupType === "unload_selection_fail") {
            if (shipment === undefined) {
                console.error("shipment is undefined, something went wrong.");
                closePopup();
                return;
            }
            const promptStatus = popupType.includes("success") ? "success" : "fail";
            return (
                <figure className={`popup_selection_${promptStatus}`}>
                    <div className={`popup_selection_${promptStatus}_header`}>
                        <h5>{shipment.routeCode}</h5>
                        <div className={`popup_selection_${promptStatus}_double_col`}>
                            <h4 className="weak">{shipment.consAdd1}</h4>
                            {shipment.consAdd2 && (
                                <h4 className="weak">{shipment.consAdd2}</h4>
                            )}
                        </div>
                    </div>
                    <div className={`popup_selection_${promptStatus}_body`}>
                        <img id={`${promptStatus}_image`} src={popupType.includes("success") ? Success_Image : Fail_Image} alt={`${promptStatus} image`} />
                        <p>{popupType.includes("success") ? "Successfully logged package!" : "Failed to log package!"}</p>
                        <div className="barcode_input_div">
                            <form>
                                <input
                                    type="text"
                                    id="barcode_input"
                                    value={barcode}
                                    disabled
                                />
                            </form>
                        </div>
                    </div>
                </figure>    
            )
        } else if (popupType === "load") {
            return (
                <div className="load_popup">
                    <h3>Hello World!</h3>
                </div>
            )
        } else if (popupType === "fail") {
            return (
                <div className="popupWarehouseWindow fail_popup">
                    <img id="fail" src={Fail_Image} alt="fail" />
                    <p>Oops! Something went wrong, logging out.</p>
                </div>
            )
        } /*else if (popupType === "success") {
            return (
                <div className="popupWarehouseWindow success_popup">
                    <img id="success" src={Success} alt="success" />
                    <p>Logout success!</p>
                </div>
            )
        }*/
        return null;
    }
    const overlayClass = isVisible ? 'overlay-visible' : 'overlay-hidden';

    let popupClass = "popupDefault";
    if (popupType.includes("success")|| popupType.includes("fail")) {
        
        popupClass = popupType.includes("success") ? "popupSuccess" : "popupFail";
        return (
            <div id="popup_overlay" className={`overlay ${overlayClass}`}>
                <div className={popupClass}>
                    {popupContent()}
                </div>
            </div>
        )
    }
    else if (popupType.includes("unload_selection")) {
        popupClass = "popupUnloadSelection";
    } 
    else if (popupType.includes("unload")) {
        popupClass = "popupUnload";
    } 

    return (
        <div id="popup_overlay" className={`overlay ${overlayClass}`}>
            <div className={popupClass}>
                <div id="popupExit" className="content">
                    <h1 id="close" className="popupWarehouseWindow" onClick={closePopup}>&times;</h1>
                </div>
                {popupContent()}
            </div>
        </div>
    )
};

export default Popup;