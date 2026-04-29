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

export interface ClubbyCheckoutUrlRequest {
  club_account_id: string;
  userId?: string;
  year_month?: string;
  pay_all?: boolean;
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

export const getClubbyCheckoutUrl = (
  request: ClubbyCheckoutUrlRequest,
) => {
  const params = new URLSearchParams({
    club_account_id: request.club_account_id,
  });

  if (request.userId) {
    params.set("user_id", request.userId);
  }

  if (request.year_month) {
    params.set("year_month", request.year_month);
  }

  if (request.pay_all) {
    params.set("pay_all", "true");
  }

  return api
    .get(`/payfast/getClubbyCheckoutUrl?${params.toString()}`)
    .then((res) => res.data);
};
