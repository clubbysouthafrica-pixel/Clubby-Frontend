import { api } from "./api";

// List storage units with query parameters
export const listStorageQuery = (clubId: string) => {
  return api
    .get(`/storage/listStorage?club_account_id=${clubId}`)
    .then((res) => res.data);
};

// List storage requests
export const listStorageRequestQuery = (clubId: string) => {
  return api
    .get(`/storage/listStorageRequests?club_account_id=${clubId}`)
    .then((res) => res.data);
};

// Create a storage request unit
export const createStorageRequest = (storageRequest: any) => {
  return api
    .post(`/storage/createStorageRequest`, storageRequest)
    .then((res) => res.data);
};
