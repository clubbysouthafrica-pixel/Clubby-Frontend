export interface Club {
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
    club_name: string
    member_first_name: string
    member_surname: string
    member_email?:string
    outstanding_amount: number
    primary_member: string
    registration_submitted_on: string
    registration_payment_reference: string
    user_id: string
}

export interface RegisterClubMember {
    clubId: string
    userId: string
    payment_amount: number
}