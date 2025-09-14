export interface InputBillingOption {
    label: string
    amount: number
    option_order_id: string
}

export interface InputFormRegistration {
    field_name: string
    field_text: string
    input_type: string
    field_order_id: number
    required: boolean,
    field_type: string
    placeholder: string
    field_id: string
    currency?: string
    billingOptions?: InputBillingOption[]
    amount?: number;
    options?: string[];
    value?: any
}

export interface PageFormRegistration {
    page_header: string
    page_index: number
    fields: InputFormRegistration[]
}

export interface FormRegistrationRequest {
    club_account_id: string
    deleteFields: string[]
    pages: PageFormRegistration[]
}