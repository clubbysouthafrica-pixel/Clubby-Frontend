import { RegisterClubMember } from "@/interfaces/club";
import { api } from "./api";

export const fetchClubMembers = (clubId: string) => {
    return api.get(`/clubMember/getAllClubMembers?club_account_id=${clubId}`)
        .then(res => res.data);
} 

export const registerMemberToClub = (request: RegisterClubMember) => 
    api.post("/clubMember/registerMember", {
        club_account_id: request.clubId,
        member_id: request.userId,
        payment_amount: request.payment_amount
    }).then(res => res.data)