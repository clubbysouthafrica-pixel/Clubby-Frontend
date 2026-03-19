import { api } from "./api";

export interface UpdatePayFastDetailsRequest {
  club_account_id: string;
  merchant_id?: string;
  merchant_key?: string;
  passphrase?: string;
  auto_register_members_if_paid?: boolean;
}

export interface ResetPayFastDetailsRequest {
  club_account_id: string;
}

export const updatePayFastDetails = (
  updatePayFastDetailsRequest: UpdatePayFastDetailsRequest
) => {
  return api
    .post("/payfast/updateDetails", updatePayFastDetailsRequest)
    .then((res) => res.data);
};

export const resetPayFastDetails = (
  updatePayFastDetailsRequest: ResetPayFastDetailsRequest
) => {
  return api
    .post("/payfast/resetDetails", updatePayFastDetailsRequest)
    .then((res) => res.data);
};
