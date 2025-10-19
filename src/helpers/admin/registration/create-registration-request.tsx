export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER" | "SIGNATURE";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

export interface BillingOption {
    option_order_id: string;
    amount: number;
    label: string;
}

export interface PageFieldBase {
    field_order_id: string;
    field_id: string;
    field_type: FieldType;
    signature_type?: string
    field_text?: string;
    field_name: string;
    required?: boolean;
    input_type: InputType;
    placeholder?: string;
    options?: string[];
    billingOptions?: BillingOption[];
    currency?: string;
    amount?: number;
    multiplier?: boolean
    multiplier_value?: number
    value?: string | number;
    selectedAmountCents?: number;
    option_order_id?: string;
    label?: string;
}

export interface FieldRequest {
    field_id: string
    value: string | number
    option_order_id?: string
    signature_type?: string
    multiplier_value?: number
    label?: string
}

export interface SubmitRegistrationRequest {
    club_account_id: string
    member_email: string
    first_name: string
    surname: string
    billing_fields: FieldRequest[],
    standard_fields: FieldRequest[]
}

export function createValidRegistrationRequest(fields: PageFieldBase[], clubId: string, member_email: string, surname: string, firstname: string): SubmitRegistrationRequest {
    const request: SubmitRegistrationRequest = {
        member_email: member_email,
        surname: surname,
        first_name: firstname,
        club_account_id: clubId,
        billing_fields: [],
        standard_fields: []
    }

    const billing_fields = fields.filter((field: PageFieldBase) => field.field_type === "BILLING");
    billing_fields.forEach(f => {
        if (f.input_type === "TEXT" && !f.multiplier) {
            f.value = f.amount
        } else if (f.input_type === "TEXT" && f.multiplier && !f.multiplier_value && f.required) {
            f.value = f.amount
            f.multiplier_value = 1
        }

        if (f.value) {
            const field: FieldRequest = {
                field_id: f.field_id,
                value: f?.selectedAmountCents ?? f.value,
                multiplier_value: f?.multiplier_value ?? 1,
                option_order_id: f.option_order_id,
                label: f.label
            }
            request.billing_fields.push(field)
        }
    });

    const standard_fields = fields.filter((field: PageFieldBase) => field.field_type === "STANDARD");
    standard_fields.forEach(f => {
        if (f.input_type === "SIGNATURE") {
            const field: FieldRequest = {
                field_id: f.field_id,
                value: f.value as string | number,
                signature_type: f.signature_type
            }
            request.standard_fields.push(field)
        } else if (f.value) {
            const field: FieldRequest = {
                field_id: f.field_id,
                value: f.value
            }
            request.standard_fields.push(field)
        }
    });


    return request
}