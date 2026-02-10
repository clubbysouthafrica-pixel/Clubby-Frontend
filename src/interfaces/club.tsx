export interface Club {
    resubmission_required: boolean
    club_name: string
    currency: string
    club_account_id: string
    club_type: string
    registered: boolean
    club_cover_url?: string
    club_profile_url?: string
    primary_member: string
    outstanding_amount: number
    registration_amount: number
    registration_payment_reference?: string
}

export interface ClubMember {
    billing_type: string
    deregistered_on?: number
    club_name: string
    member_first_name: string
    member_surname: string
    member_email:string
    total_fee?: number
    meta_billing: Record<string, any>
    meta_standard: Record<string, any>
    outstanding_amount: number
    primary_member: string
    registered_on: string
    registration_submitted_on: string
    last_season_registration?: boolean
    registration_payment_reference: string
    user_id: string
    resubmission_required: boolean
}

export interface RegisterClubMember {
    clubId: string
    userId: string
    payment_amount: number
    payment_method?: string
    template_variables?: Array<{ name: string; value: string }>
}