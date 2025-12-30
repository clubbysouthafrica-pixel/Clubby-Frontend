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
        payment_amount: request.payment_amount,
        payment_method: request.payment_method,
        template_variables: request.template_variables
    }).then(res => res.data)

export const removeMember = (clubAccountId: string, memberIds: string[]) =>
    api.post(`/clubMember/removeMember?club_account_id=${clubAccountId}`, {
        member_ids: memberIds
    }).then(res => res.data)