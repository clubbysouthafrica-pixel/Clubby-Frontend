// --- Types that match the new payload ---
export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

export interface BillingOption {
    option_order_id: string;
    amount: number; // in cents
    label: string;
}

export interface PageFieldBase {
    field_order_id: string;
    field_id: string;
    field_type: FieldType;
    field_text?: string; // helper/label text
    field_name: string; // title when STANDARD/BILLING
    required?: boolean;
    input_type: InputType; // when STANDARD/BILLING
    placeholder?: string;
    options?: string[]; // for STANDARD DROPDOWN
    billingOptions?: BillingOption[]; // for BILLING DROPDOWN
    currency?: string; // for BILLING
    amount?: number; // for BILLING fixed price (cents)

    // --- UI state ---
    value?: string | number; // typed text or selected label
    selectedAmountCents?: number; // derived for BILLING when dropdown
    option_order_id?: string;
    label?: string;
}

export interface FieldRequest {
    field_id: string
    value: string | number
    option_order_id?: string
    label?: string
}

export interface SubmitRegistrationRequest {
    club_account_id: string
    billing_fields: FieldRequest[],
    standard_fields: FieldRequest[]
}

export function createValidRegistrationRequest(fields: PageFieldBase[], clubId: string): SubmitRegistrationRequest {
    const request: SubmitRegistrationRequest = {
        club_account_id: clubId,
        billing_fields: [],
        standard_fields: []
    }

    const billing_fields = fields.filter((field: PageFieldBase) => field.field_type === "BILLING");
    billing_fields.forEach(f => {
        if (f.input_type === "TEXT") {
            f.value = f.amount
        }

        if (f.value) {
            const field: FieldRequest = {
                field_id: f.field_id,
                value: f?.selectedAmountCents ?? f.value,
                option_order_id: f.option_order_id,
                label: f.label
            }
            request.billing_fields.push(field)
        }
    });

    const standard_fields = fields.filter((field: PageFieldBase) => field.field_type === "STANDARD");
    standard_fields.forEach(f => {
        if (f.value) {
            const field: FieldRequest = {
                field_id: f.field_id,
                value: f.value
            }
            request.standard_fields.push(field)
        }
    });


    return request
}