import { api } from "./api";

// List storage units with query parameters
export const listStorageQuery = (query: any) => {
  return api
    .get(`/storage/listStorage`, { params: query })
    .then((res) => res.data);
};

// List storage requests
export const listStorageRequestQuery = () => {
  return api.get(`/storage/listStorageRequests`).then((res) => res.data);
};

// Update a storage request unit
export const updateStorageRequestUnit = (storageRequest: any) => {
  return api
    .put(`/storage/updateStorageRequest`, storageRequest)
    .then((res) => res.data);
};
