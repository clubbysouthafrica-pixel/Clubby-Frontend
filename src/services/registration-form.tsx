import { RegistrationRequest } from "@/requests/registration-request";
import { api } from "./api";

export const fetchRegistrationForm = (clubAccountId: string, email?: string): Promise<any> => {
    if (!clubAccountId) throw new Error("no club set")

    const params = new URLSearchParams({ club_account_id: clubAccountId });
    if (email) params.set("email", email);

    return api.get(`/registration/getForm?${params.toString()}`)
        .then(res => res.data);
} 

export const fetchMemberRegistration = (clubAccountId: string, currency: string): Promise<any> => {
    if (!clubAccountId || !currency) throw new Error("no club set")

    return api.get(`/registration/getMemberRegistration?club_account_id=${clubAccountId}&currency=${currency}`)
        .then(res => res.data);
} 

export const createMemberRegistrationForm = (registrationFromRequest: RegistrationRequest): Promise<any> => {
    return api.put('/clubMember/submitRegistration', registrationFromRequest)
        .then(res => res.data)
}

export const fetchMemberRegistrationField = (clubAccountId: string, fieldId: string): Promise<any> => {
    if (!clubAccountId || !fieldId) throw new Error("clubAccountId and fieldId are required")

    return api.get(`/registration/getRegistrationField?club_account_id=${clubAccountId}&field_id=${fieldId}`)
        .then(res => {
            return res.data;
        })
}

export const updateMemberRegistrationField = (
    registrationId: string,
    fieldId: string,
    fieldName: string,
    type: string,
    value: string,
    sensitive_information?: boolean
): Promise<any> => {
    if (!registrationId || !fieldId || !fieldName || !type) {
        throw new Error("registrationId, fieldId, fieldName, and type are required");
    }

    return api.post("/registration/updateRegistrationField", {
        registration_id: registrationId,
        field_id: fieldId,
        field_name: fieldName,
        type: type,
        value: value,
        sensitive_information: sensitive_information
    })
        .then(res => {
            return res.data;
        })
}