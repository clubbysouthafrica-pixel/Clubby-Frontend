import { getProratedAmount } from "@/lib/billing-prorata";
import { parseUploadedImages } from "@/helpers/registration/parse-uploaded-images";

export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER" | "SIGNATURE" | "IMAGE";
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
    prorata?: {
        enabled?: boolean;
        rules?: Array<{
            id?: string;
            prorata_start_date: string;
            prorata_end_date: string;
            prorata_percentage: number;
        }>;
    };
}

export interface FieldRequest {
    field_id: string
    value: string | number
    signature_type?: string
    option_order_id?: string
    multiplier_value?: number
    images?: string[]
    label?: string
}

export interface SubmitRegistrationRequest {
    club_account_id: string
    email_opt_in: boolean
    billing_fields: FieldRequest[],
    standard_fields: FieldRequest[]
}

export function createValidRegistrationRequest(fields: PageFieldBase[], clubId: string): SubmitRegistrationRequest {
    const request: SubmitRegistrationRequest = {
        club_account_id: clubId,
        email_opt_in: false,
        billing_fields: [],
        standard_fields: []
    }

    const billing_fields = fields.filter((field: PageFieldBase) => field.field_type === "BILLING");
    billing_fields.forEach(f => {
        const baseAmount = getProratedAmount(f.amount ?? 0, f);

        if (f.input_type === "TEXT" && !f.multiplier) {
            f.value = baseAmount
            f.multiplier_value = 1
        } else if (f.input_type === "TEXT" && f.multiplier && !f.multiplier_value && f.required) {
            f.value = baseAmount
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
        } else if (f.input_type === "IMAGE") {
            const images = parseUploadedImages(f.value)
            if (images.length > 0) {
                request.standard_fields.push({
                    field_id: f.field_id,
                    value: JSON.stringify(images),
                    images,
                })
            }
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