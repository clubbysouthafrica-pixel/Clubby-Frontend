import { api } from "./api";

export const fetchMemberUser  = (memberUserId: string): Promise<any> => {
    return api.get(`/member/getUser?member_user_id=${memberUserId}`)
        .then(res => res.data);
} 
