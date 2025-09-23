export interface ClubBankDetailsRequest {
    bank: string,
    account_number:string
    branch_code: string
    account_type: string
}

export interface ClubLocationDetailsRequest {
    country: string
}

export interface ClubDetailsRequest {
    club_account_id: string
    bank_details: ClubBankDetailsRequest
    country_of_operation: string
    currency: string
    support_email: string
}