import React from 'react';
import type { ValidationForm, ValidationErrors } from '../DeliveryValidation';
import "./MenuWindow.css";

interface LoadMenuWindowProps {
    formData: ValidationForm;
    inputErrors: ValidationErrors;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const LoadMenuWindow: React.FC<LoadMenuWindowProps> = ({
    formData,
    inputErrors,
    handleChange,
    handleSubmit
}) => {
    return (
        <figure className="ul_dv_fig">
            <form id="ul_dv_form" onSubmit={handleSubmit}>
                <div className="ul_dv_input_wrapper">
                    <label htmlFor="dlvddate">Delivery Date:</label>
                    <input 
                        type="date"
                        id="dlvddate" // WARNING functional ID
                        value={formData?.mfstdate}
                        className={`input_form ${inputErrors?.mfstdate ? 'invalid_input' : ''}`}
                        onChange={handleChange}
                        aria-invalid={!!inputErrors?.mfstdate}
                        aria-describedby={inputErrors?.mfstdate ? "ff_dv_confirm_date" : undefined}
                    />
                    {(inputErrors?.mfstdate && !inputErrors?.powerunit) && (
                        <div className={`aria_fail_flag ${inputErrors?.mfstdate ? 'visible' : ''}`}
                            id="ff_dv_confirm_date" // WARNING functional ID
                            role="alert"
                        >
                            <p>{inputErrors?.mfstdate}</p>
                        </div>
                    )}
                </div>
                <div className="ul_dv_input_wrapper">
                    <label htmlFor="powerunit">Power Unit:</label>
                    <input 
                        type="text"
                        id="powerunit" // WARNING functional ID
                        value={formData?.powerunit}
                        className={`input_form ${inputErrors?.powerunit ? 'invalid_input' : ''}`}
                        onChange={handleChange}
                        aria-invalid={!!inputErrors?.powerunit}
                        aria-describedby={inputErrors?.powerunit ? "ff_dv_confirm_powerunit": undefined}
                    />
                    {inputErrors.powerunit && (
                        <div className={`aria_fail_flag ${inputErrors?.powerunit ? 'visible' : ''}`}
                            id="ff_dv_confirm_powerunit" // WARNING functional ID
                            role="alert"
                        >
                            <p>{inputErrors?.powerunit}</p>
                        </div>
                    )}
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