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
