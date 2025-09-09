import React, { useRef } from 'react';
import type { ValidationForm, ValidationErrors } from '../DeliveryValidation';
import "./MenuWindow.css";

interface LoadMenuWindowProps {
    prompt: string;
    formData: ValidationForm;
    inputErrors: ValidationErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const LoadMenuWindow: React.FC<LoadMenuWindowProps> = ({
    prompt,
    formData,
    inputErrors,
    handleChange,
    handleSubmit
}) => {
    // Handler to open the calendar when the icon is clicked
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    const handleIconClick = () => {
        if (dateInputRef.current) {
        dateInputRef.current.showPicker();
        }
    };

    return (
        <figure className="ul_dv_fig">
            <div className="ul_dv_header">
                <h4 className="ul_dv_header_prompt">{prompt}</h4>
            </div>
            <form id="ul_dv_form" onSubmit={handleSubmit} noValidate>
                <div className="ul_dv_input_wrapper">
                    <label htmlFor="dlvddate">Delivery Date:</label>
                    <div className="ff_input_wrapper">
                        <div className="date_input_wrapper">
                            <input 
                                type="date"
                                id="dlvddate" // WARNING functional ID
                                value={formData?.mfstdate}
                                className={`input_form ${inputErrors?.mfstdate ? 'invalid_input' : ''}`}
                                onChange={handleChange}
                                ref={dateInputRef}
                                aria-invalid={!!inputErrors?.mfstdate}
                                aria-describedby={inputErrors?.mfstdate ? "mw_dv_date" : undefined}
                            />
                            <svg className="calendar-icon" fill="none" viewBox="0 0 24 24" onClick={handleIconClick}>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h.01M12 15h.01M12 11h.01M16 15h.01M16 11h.01"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    fill="none"
                                    d="M5 3L19 3a2 2 0 012 2L21 19a2 2 0 01-2 2L5 21a2 2 0 01-2-2L3 5a2 2 0 012-2z"
                                />
                            </svg>
                        </div>
                        {(inputErrors?.mfstdate && !inputErrors?.powerunit) && (
                            <div className={`mw_aria_ff ${inputErrors?.mfstdate ? 'visible' : ''}`}
                                id="mw_dv_date" // WARNING functional ID
                                role="alert"
                            >
                                <p>{inputErrors?.mfstdate}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ul_dv_input_wrapper">
                    <label htmlFor="powerunit">Power Unit:</label>
                    <div className="ff_input_wrapper">
                        <input 
                            type="text"
                            id="powerunit" // WARNING functional ID
                            value={formData?.powerunit}
                            className={`input_form ${inputErrors?.powerunit ? 'invalid_input' : ''}`}
                            onChange={handleChange}
                            aria-invalid={!!inputErrors?.powerunit}
                            aria-describedby={inputErrors?.powerunit ? "mw_dv_powerunit": undefined}
                        />
                        {inputErrors.powerunit && (
                            <div className={`mw_aria_ff ${inputErrors?.powerunit ? 'visible' : ''}`}
                                id="mw_dv_powerunit" // WARNING functional ID
                                role="alert"
                            >
                                <p>{inputErrors?.powerunit}</p>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    type="submit"
                    id="dv_confirm_button"
                    //ref={addContinueButtonRef}
                >Continue</button>
            </form>
        </figure>
    );
}

export default LoadMenuWindow;