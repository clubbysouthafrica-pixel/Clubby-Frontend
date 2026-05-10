import { api } from "./api";

export interface UpdateSnapScanDetailsRequest {
  club_account_id: string;
  merchant_id: string;
  api_key: string;
}

export interface ResetSnapScanDetailsRequest {
  club_account_id: string;
}

export interface FetchSnapScanQRCodeRequest {
  club_account_id: string;
  user_id: string;
  transaction_id: string;
}

export interface FetchSnapScanQRCodeResponse {
  merchant_key: string;
  merchant_reference: string;
}

export const updateSnapScanDetails = (
  updateSnapScanDetailsRequest: UpdateSnapScanDetailsRequest,
) => {
  return api
    .post("snapscan/updateDetails", updateSnapScanDetailsRequest)
    .then((res) => res.data);
};

export const resetSnapScanDetails = (
  resetSnapScanDetailsRequest: ResetSnapScanDetailsRequest,
) => {
  return api
    .post("snapscan/resetDetails", resetSnapScanDetailsRequest)
    .then((res) => res.data);
};

export const fetchSnapScanQRCode = (
  fetchSnapScanQRCodeRequest: FetchSnapScanQRCodeRequest,
) => {
  const queryParams = new URLSearchParams({
    club_account_id: fetchSnapScanQRCodeRequest.club_account_id,
    user_id: fetchSnapScanQRCodeRequest.user_id,
    transaction_id: fetchSnapScanQRCodeRequest.transaction_id,
  });

  return api
    .get(`snapscan/fetchQRCode?${queryParams.toString()}`)
    .then((res) => res.data as FetchSnapScanQRCodeResponse);
};