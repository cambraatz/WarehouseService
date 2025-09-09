import React, { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PopupType } from './types/popup';
import BarCodeScan from '../../assets/BarcodeScan.png';
import Success_Image from '../../assets/success.svg';
import Fail_Image from '../../assets/error.svg';
import './Popup.css';
import type { RawShipment } from '../../types/shipments';
import type { Delivery } from '../DeliveryManifest';

interface PopupProps {
    popupType: PopupType;
    isVisible: boolean;
    shipment?: RawShipment;
    delivery?: Delivery;
    barcode?: string;
    setBarcode?: Dispatch<SetStateAction<string>>;
    trailerNum?: string;
    setTrailerNum?: Dispatch<SetStateAction<string>>;
    closePopup: () => void;
    handleBarcodeSubmit?: (barcode: string) => void;
    handleTrailerNumSubmit?: (trailerNum: string) => void;
    handleEventSubmitAsync?: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const Popup: React.FC<PopupProps> = ({ 
    popupType,
    isVisible,
    shipment,
    delivery,
    barcode,
    setBarcode,
    trailerNum,
    setTrailerNum,
    closePopup,
    handleBarcodeSubmit,
    handleTrailerNumSubmit,
    handleEventSubmitAsync,
}) => {
    // establish ref to input on popup...
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const typesToFocus = ['unload', 'unload_selection', "load_trailer_selection"];
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

    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (setBarcode) {
            const rawValue = e.target.value.toUpperCase();
            // reject non-alphanumeric values...
            const numericValue = rawValue.replace(/[^A-Z0-9]/g, '');

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

    const DEFAULT_TRAILER: string = "XXXXXXXXXXXXXXXXX";
    const handleTrailerNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (setTrailerNum) {
            const rawVal = e.target.value.toUpperCase();
            const formattedVal = rawVal.replace(/[^A-Z0-9]/g, '');
            setTrailerNum(formattedVal);
        }
    };

    const handleTrailerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setTrailerNum || !trailerNum || !handleTrailerNumSubmit) {
            console.error("Missing trailer data/functions to submit.");
            return;
        }

        if (trailerNum.replace(/[^A-Z0-9]/g, '').length === 17) {
            handleTrailerNumSubmit(trailerNum);
            setTrailerNum('');
            closePopup();
        } else {
            console.error('Invalid trailer number format. Please check the value.');
        }
    }

    const handleUnloadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!setBarcode || !barcode || !handleBarcodeSubmit) {
            console.error("Missing barcode data/functions to submit.");
            return;
        }

        // ensure unload popup is open and valid barcode...
        if (barcode.replace(/[^A-Z0-9]/g, '').length === 9) {
            handleBarcodeSubmit(barcode);
            setBarcode('');
            closePopup();
        } else {
            console.log('Invalid barcode format. Please check the value.');
        }
    };

    const handleUnloadSelectionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode) {
            console.error("Missing barcode data to submit.");
            return;
        }
        if (!handleBarcodeSubmit) {
            console.error("Missing barcode functions to submit.");
            return;
        }

        // ensure unload popup is open and valid barcode...
        if (popupType === "unload_selection") {
            handleBarcodeSubmit(barcode);
        } else {
            console.log('Invalid barcode format. Please check the value.');
        }
    }

    const popupContent = (): React.ReactNode => {
        if (popupType === "unload" && setBarcode) {
            return (
                <div className="popupPrompt">
                    <img id="code_scan_image" src={BarCodeScan} alt="code scanner image" />
                    <p>Scan/Enter Freight Barcode</p>
                    <div className="code_input_div">
                        <form onSubmit={handleUnloadSubmit}>
                            <input
                                type="text"
                                id="code_input"
                                placeholder={DEFAULT_CODE}
                                value={barcode}
                                ref={inputRef}
                                onChange={handleBarcodeChange}
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
                        <img id="code_scan_image" src={BarCodeScan} alt="code scanner image" />
                        <p>Scan/Enter Bin Location Code</p>
                        <div className="code_input_div">
                            <form onSubmit={handleUnloadSelectionSubmit}>
                                <input
                                    type="text"
                                    id="code_input"
                                    placeholder={DEFAULT_CODE}
                                    value={barcode}
                                    ref={inputRef}
                                    onChange={handleBarcodeChange}
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
                        <div className="code_input_div">
                            <form>
                                <input
                                    type="text"
                                    id="code_input"
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
        } else if (popupType === "load_trailer_selection") {
            if (delivery === undefined || !setTrailerNum) {
                console.error("delivery is undefined, something went wrong.");
                closePopup();
                return;
            }
            return (
                <figure className="popup_load_selection">
                    <div className="popup_load_selection_header">
                        <h5>{delivery.proNumber}</h5>
                        <div className="popup_load_selection_double_col">
                            <h4 className="weak">{delivery.consAdd1}</h4>
                            {delivery.consAdd2 && (
                                <h4 className="weak">{delivery.consAdd2}</h4>
                            )}
                        </div>
                    </div>
                    <div className="popup_load_selection_body">
                        <img id="code_scan_image" src={BarCodeScan} alt="code scanner image" />
                        <p>Scan/Enter Trailer Code</p>
                        <div className="code_input_div">
                            <form onSubmit={handleTrailerSubmit}>
                                <input
                                    type="text"
                                    id="code_input"
                                    placeholder={DEFAULT_TRAILER}
                                    value={trailerNum}
                                    ref={inputRef}
                                    onChange={handleTrailerNumChange}
                                />
                                <div className="load_button_div">
                                    <button type="submit">Submit</button>
                                    <button type="button" onClick={() => setTrailerNum(DEFAULT_CODE)}>Reset</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </figure>  
            )
        } else if (popupType === "load_ex_dv_conflict") {
            return (
                <figure className="popup_load_conflict">
                    <div id="popup_load_prompt" className="content">
                        <img id="fail" src={Fail_Image} alt="fail"/>
                        <p>Existing session already exists, proceed to logout of the previous session.</p>
                    </div>
                    <form className="popup_form" onSubmit={handleEventSubmitAsync}>
                        <button 
                            className="popup_button"
                            type="submit"
                        >Login</button>
                        <button className="popup_button" onClick={closePopup}>Cancel</button>
                    </form>
                </figure>
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
    else if (popupType.includes("load_trailer")) {
        popupClass = "popupLoadSelection";
    }
    else if (popupType.includes("unload")) {
        popupClass = "popupUnload";
    }
    else if (popupType.includes("load")) {
        popupClass = "popupLoad";
    }

    return (
        <div id="popup_overlay" className={`overlay ${overlayClass}`}>
            <div className={`popup ${popupClass}`}>
                <div id="popupExit" className="content">
                    <h1 id="close" className="popupWarehouseWindow" onClick={closePopup}>&times;</h1>
                </div>
                {popupContent()}
            </div>
        </div>
    )
};

export default Popup;