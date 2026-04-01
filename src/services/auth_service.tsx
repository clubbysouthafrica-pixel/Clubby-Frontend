import { api } from "@/services/api.tsx";

export const getAuthToken = async () => {
    // todo - update
    const response = await api.post('/prod/member/getMSCToken', {
        "userId": "myclubsoftware_342129",
        "token": "mf508mf959mfn44"
    });

    return response.data;
}

export const forgotPassword = async (username: string) => {
    const response = await api.post('/member/forgotPassword',
        {
            username
        },
        {
            validateStatus: (status) => status === 200 || status === 404 || status === 411,
        }
    );

    return response;
}

export const activateMemberUser = async (email: string, session: string, password: string) => {
    const response = await api.post('/member/activateUser', {
        email,
        session,
        password
    });

    return response.data;
}

export const resetPassword = async (username: string, code: string, newPassword: string) => {
    const response = await api.post('/member/resetPassword', {
        username,
        confirmation_code: code,
        new_password: newPassword
    });

    return response.data;
}

export const resetMemberTemporaryPassword = async (email: string) => {
    const response = await api.post('/member/resetTemporaryPassword', {
        username: email
    });

    return response;
}