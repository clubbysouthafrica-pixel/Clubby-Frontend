import { api } from "./api";

export const fetchAdminClubs = () => {
    return api.get("/clubAdmin/getAllAdminClubs")
        .then(res => res.data);
} 