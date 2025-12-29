export interface ClubBankDetailsRequest {
    bank: string,
    account_number:string
    branch_code: string
    account_type: string
}

export interface ClubPayFastDetailsRequest {
    merchant_id: string
    merchant_key: string
    passphrase?: string
}

export interface ClubLocationDetailsRequest {
    country: string
}

export interface ClubDetailsRequest {
    club_account_id: string
    bank_details: ClubBankDetailsRequest
    payfast_details?: ClubPayFastDetailsRequest
    country_of_operation: string
    currency: string
    support_email: string
    club_url?: string
    hide_from_public?: boolean
    registration_submission_email_template_body: string
    registration_submission_email_subject: string
    registration_success_email_template_body: string
    registration_success_email_subject: string
    use_success_email_template: boolean
    use_submission_email_template: boolean
    notify_on_member_registration?: boolean
}