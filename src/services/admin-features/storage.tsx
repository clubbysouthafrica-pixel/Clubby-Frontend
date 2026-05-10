import { api } from "./api";

// Create a storage unit
export const createStorageUnit = (storageRequest: any) => {
  return api
    .post(`/storage/createStorage`, storageRequest)
    .then((res) => res.data);
};

// Remove a storage unit by ID
export const removeStorage = (storageId: string) => {
  return api
    .delete(`/storage/removeStorage`, { params: { storage_id: storageId } })
    .then((res) => res.data);
};

// List storage units with query parameters
export const listStorageQuery = (clubId: string) => {
  return api
    .get(`/storage/listStorage?club_account_id=${clubId}`)
    .then((res) => res.data);
};

// List storage requests
export const listStorageRequestQuery = (clubId: string) => {
  return api
    .get(`/storage/listStorageRequests`, {
      params: { club_account_id: clubId },
    })
    .then((res) => res.data);
};

// Update a storage request unit
export const updateStorageRequestUnit = (storageRequest: any) => {
  return api
    .put(`/storage/updateStorageRequest`, storageRequest)
    .then((res) => res.data);
};
