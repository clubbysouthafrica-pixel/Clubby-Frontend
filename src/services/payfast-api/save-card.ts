import { api } from "./api";

interface SaveCardParams {
    club_account_id: string;
    first_name: string;
    surname: string;
    email: string;
}

interface SaveCardResponse {
    redirectUrl: string;
}

export const getSaveCardUrl = (params: SaveCardParams): Promise<SaveCardResponse> => {
    const queryParams = new URLSearchParams({
        club_account_id: params.club_account_id,
        first_name: params.first_name,
        surname: params.surname,
        email: params.email,
    });
    return api.get(`/payfast/saveCard?${queryParams.toString()}`).then((res) => res.data);
};
