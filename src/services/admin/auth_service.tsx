import { api } from "@/services/admin/api.tsx";

export const activateAdminUser = async (email: string, session: string, password: string) => {
    const response = await api.post('/admin/activateUser', {
        email,
        session,
        password
    });

    return response.data;
}

export const resetAdminTemporaryPassword = async (email: string) => {
    const response = await api.post('/admin/resetTemporaryPassword', {
        username: email
    });

    return response;
}

export const forgotPassword = async (username: string) => {
    const response = await api.post('/admin/forgotPassword',
        {
            username
        },
        {
            validateStatus: (status) => status === 200 || status === 404 || status === 411,
        }
    );

    return response;
}