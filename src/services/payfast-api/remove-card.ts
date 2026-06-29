import { api } from "./api";

interface RemoveCardParams {
    club_account_id: string;
}

export const removeCard = (params: RemoveCardParams): Promise<void> => {
    return api.post("/payfast/removeCard", { club_account_id: params.club_account_id });
};
