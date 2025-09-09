import React, { useEffect, useRef } from 'react';
import BarCodeScan from '../../assets/BarcodeScan.png';
import "./MenuWindow.css";

interface UnloadMenuWindowProps {
    prompt: string;
    barcode: string;
    setBarcode: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const UnloadMenuWindow: React.FC<UnloadMenuWindowProps> = ({
    prompt,
    barcode,
    setBarcode,
    handleSubmit
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current!.focus();
            setBarcode('');
        }
    }, []);

    const DEFAULT_CODE: string = "XXX-XX-XXXX";
    //const [barcode, setBarcode] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    return (
        <figure className="umw_figure">
            <div className="umw_header">
                <h4 className="umw_prompt">{prompt}</h4>
            </div>
            <div className="umw_body">
                <img id="umw_barcode_image" src={BarCodeScan} alt="barcode scanner image" />
                <form className="umw_form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="barcode_input"
                        placeholder={DEFAULT_CODE}
                        value={barcode}
                        ref={inputRef}
                        onChange={handleChange}
                    />
                    <div className="umw_button_div">
                        <button type="submit">Submit</button>
                        <button type="button" onClick={() => setBarcode('')}>Reset</button>
                    </div>
                </form>
            </div>
        </figure>
    );
}

export default UnloadMenuWindow;