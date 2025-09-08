import { ClubDetailsRequest } from "@/requests/club-request";
import { api } from "./api";

export const fetchClub = (clubAccountId: string): Promise<any> => {
    return api.get(`/club/getClub?club_account_id=${clubAccountId}`)
        .then(res => res.data);
} 

export const listClubs = () => {
    return api.get(`/club/getAllClubs`)
        .then(res => res.data)
}

export const fetchClubDetails = (clubId: string) => {
    return api.get(`/club/getClubDetails?club_account_id=${clubId}`).then(res => res.data)
}

export const updateClubDetails = (clubDetailsRequest: ClubDetailsRequest) => {
    return api.post("club/updateClubDetails", clubDetailsRequest).then(res => res.data)
}