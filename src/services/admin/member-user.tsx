import { api } from "./api";

export const fetchMemberUser  = (memberUserId: string, registrationId?: string): Promise<any> => {
    let url = `/member/getUser?member_user_id=${memberUserId}`;
    if (registrationId) {
        url += `&registration_id=${registrationId}`;
    }
    return api.get(url)
        .then(res => res.data);
} 
