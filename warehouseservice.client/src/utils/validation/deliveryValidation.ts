import type { ValidationForm } from "../../components/DeliveryValidation";
export function validate_dv_form(formData: ValidationForm) {
    let isValid: boolean = true;
    let message: string = "";
    let dateError: string | undefined = undefined;
    let powerunitError: string | undefined = undefined;

    const date_in_form = new Date(formData.deliveryDate);

    if (isNaN(date_in_form.getTime())) {
        dateError = "Valid powerunit is required!";
        isValid = false;
    };

    if (formData.powerunit.trim() == "") {
        powerunitError = "Valid powerunit is required!";
        isValid = false;
    };

    type ErrorMessages = {
        mfstdate: string;
        powerunit: string;
    }
    const errors: ErrorMessages = {
        mfstdate: "",
        powerunit: ""
    };

    if (dateError && powerunitError) {
        errors.mfstdate = "Date and Powerunit are both required!";
        errors.powerunit = "Date and Powerunit are both required!";
    } else if (dateError) {
        // only date is invalid...
        errors.mfstdate = dateError;
        message = dateError;
    } else if (powerunitError) {
        errors.powerunit = powerunitError;
        message = powerunitError;
    }

    return { isValid, errors, message };
}