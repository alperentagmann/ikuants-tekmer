export interface FormFieldInput {
    id?: string; // If provided, keeps immutable UUID
    fieldKey: string;
    label: string;
    fieldType: string; // TEXT, TEXTAREA, EMAIL, PHONE, NUMBER, DATE, SELECT, MULTISELECT, RADIO, CHECKBOX, FILE, TC_NO, KVKK, DIVIDER, HEADING
    placeholder?: string;
    helpText?: string;
    isRequired?: boolean;
    defaultValue?: string;
    validationRules?: Record<string, any>;
    conditionalRules?: Record<string, any>;
    options?: string[];
    stepNumber?: number;
    stepTitle?: string;
    width?: string; // FULL, HALF, THIRD
    sortOrder?: number;
}
