export interface StandardField {
    field_id: string
    value: any
}

export interface RegistrationRequest {
    email?: string
    club_account_id: string
    billing_fields: StandardField[]
    standard_fields: StandardField[]
}

export interface DeregisterMemberRequest {
    userIds: string[]
    clubId: string
}