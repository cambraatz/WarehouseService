import React, { useState, useEffect, useRef } from 'react';
import type { PopupType } from '../../types/popup';
import Success from '../../assets/success.svg';
import Fail from '../../assets/error.svg';
import BarCodeScan from '../../assets/BarcodeScan.png';
import './Popup.css';

interface PopupProps {
    popupType: PopupType;
    isVisible: boolean;
    closePopup: () => void;
    handleSubmit: (value: string) => void;
}

const Popup: React.FC<PopupProps> = ({ popupType, isVisible, closePopup , handleSubmit }) => {
    // establish ref to input on popup...
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isVisible]);

    const DEFAULT_CODE: string = "XXX-XX-XXXX";
    const [barcode, setBarcode] = useState<string>(DEFAULT_CODE);

    const handleUnloadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // reject non-numeric values...
        const numericValue = rawValue.replace(/[^0-9]/g, '');

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
    };

    const handleUnloadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // ensure unload popup is open and valid barcode...
        if (popupType === 'unload' && barcode.replace(/[^0-9]/g, '').length === 9) {
            if (handleSubmit) {
                handleSubmit(barcode);
            } else {
                // this should never happen...
                console.log(`Submitting value: ${barcode}`);
            }
            setBarcode(DEFAULT_CODE);
            closePopup();
        } else {
            console.log('Invalid barcode format. Please check the value.');
        }
    };

    const popupContent = (): React.ReactNode => {
        if (popupType === "unload") {
            return (
                <div className="popupPrompt">
                    <img id="barcode_scan_image" src={BarCodeScan} alt="barcode scanner image" />
                    <p>Scan/Enter Freight Barcode</p>
                    <div className="barcode_input_div">
                        <form onSubmit={handleUnloadSubmit}>
                            <input
                                type="text"
                                id="barcode-input"
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
        } else if (popupType === "load") {
            return (
                <div className="load_popup">
                    <h3>Hello World!</h3>
                </div>
            )
        } else if (popupType === "fail") {
            return (
                <div className="popupWarehouseWindow fail_popup">
                    <img id="fail" src={Fail} alt="fail" />
                    <p>Oops! Something went wrong, logging out.</p>
                </div>
            )
        } else if (popupType === "success") {
            return (
                <div className="popupWarehouseWindow success_popup">
                    <img id="success" src={Success} alt="success" />
                    <p>Logout success!</p>
                </div>
            )
        }
        return null;
    }
    const overlayClass = isVisible ? 'overlay-visible' : 'overlay-hidden';

    let popupClass = "popupDefault";
    if (popupType.includes("unload")) {
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