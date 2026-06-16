export interface StandardField {
    field_id: string
    value: any
}

export interface RegistrationRequest {
    email?: string
    email_opt_in?: boolean
    club_account_id: string
    billing_fields: StandardField[]
    standard_fields: StandardField[]
}

export interface AdminRegistrationRequest {
    member_email: string
    first_name: string
    surname: string
    email_opt_in?: boolean
    send_account_email?: boolean
    send_club_email?: boolean
    club_account_id: string
    billing_fields: StandardField[]
    standard_fields: StandardField[]
}

export interface DeregisterMemberRequest {
    userIds: string[]
    clubId: string
    deregistration_reason?: string
    refunds: string[]
}

export interface DeregisterSeasonRequest {
    clubId: string
}