import { api } from "./api";

export const fetchClub = (clubAccountId: string): Promise<any> => {
    return api.get(`/club/getClub?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

export const listClubs = () => {
    return api.get(`/club/getAllClubs`)
        .then(res => res.data)
}

export const fetchClubBankDetails = (clubId: string) => {
    return api.get(`/club/getClubBankDetails?club_account_id=${clubId}`).then(res => res.data)
}

export interface PaymentDetailsEftDetails {
    bank: string;
    account_number: string;
    branch_code: string;
    account_type: string;
}

export interface PaymentDetailsResponse {
    eft_details: PaymentDetailsEftDetails | null;
    snapscan_enabled: boolean;
    payfast_enabled: boolean;
}

export const fetchPaymentDetails = (clubId: string): Promise<PaymentDetailsResponse> => {
    return api.get(`/club/getPaymentDetails?club_account_id=${clubId}`).then(res => res.data);
}
