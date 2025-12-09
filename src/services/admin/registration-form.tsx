import { AdminRegistrationRequest, DeregisterMemberRequest, DeregisterSeasonRequest } from "@/requests/registration-request";
import { api } from "./api";
import { FormRegistrationRequest } from "@/interfaces/formRegistration";

export const createRegistrationForm = (registrationRequest: FormRegistrationRequest) => {
    return api.post("/registration/createRegistrationForm", registrationRequest)
        .then(res => res.data);
}

export const fetchRegistrationForm = (clubAccountId: string): Promise<any> => {
    if (!clubAccountId) throw new Error("no club set")

    return api.get(`/registration/getForm?club_account_id=${clubAccountId}`)
        .then(res => res.data);
} 

export const fetchMemberRegistration = (clubAccountId: string, userId: string, currency: string): Promise<any> => {
    if (!clubAccountId || !userId || !currency) throw new Error("no club set")

    return api.get(`/registration/getMemberRegistration?club_account_id=${clubAccountId}&user_id=${userId}&currency=${currency}`)
        .then(res => res.data);
} 

export const deregisterAllMembersQuery = (request: DeregisterSeasonRequest) => {
    return api.post("/deregistration/season", {club_account_id: request.clubId})
        .then(res => res.data);
}

export const deregisterMembersQuery = (request: DeregisterMemberRequest) => {
    return api.post("/deregistration/members", {
        club_account_id: request.clubId,
        user_ids: request.userIds,
        deregistration_reason: request.deregistration_reason,
    })
        .then(res => res.data);
}

export const createMemberRegistrationForm = (registrationFromRequest: AdminRegistrationRequest): Promise<any> => {
    return api.post('/clubMember/submitRegistration', registrationFromRequest)
        .then(res => res.data)
}

export const updateAdminNotes = (registrationId: string, member_id: string, adminNotes: Array<{ id: string; title: string; content: string }>): Promise<any> => {
    return api.post('/registration/updateAdminNotes', {
        registration_id: registrationId,
        member_id: member_id,
        admin_notes: adminNotes
    })
        .then(res => res.data)
}

export const removeAdminNotes = (memberId: string, registrationId: string, noteIds: string[]): Promise<any> => {
    return api.post('/registration/removeAdminNotes', {
        member_id: memberId,
        registration_id: registrationId,
        note_ids: noteIds
    })
        .then(res => res.data)
}

export const fetchRegistrationField = (clubAccountId: string, fieldId: string): Promise<any> => {
    if (!clubAccountId || !fieldId) throw new Error("clubAccountId and fieldId are required")

    return api.get(`/registration/getRegistrationField?club_account_id=${clubAccountId}&field_id=${fieldId}`)
        .then(res => {
            console.log("Registration field data:", res.data);
            return res.data;
        })
}