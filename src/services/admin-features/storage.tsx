import { api } from "./api";

type StorageLayoutUpdateRequest = {
  storage_id: string;
  storage_name: string;
  parent_id?: string | null;
  price_cents: number;
  club_account_id?: string;
  grid_position: number;
  grid_row: number;
  grid_column: number;
  layout_rows: number;
  layout_columns: number;
};

// Create a storage unit
export const createStorageUnit = (storageRequest: any) => {
  return api
    .post(`/storage/createStorage`, storageRequest)
    .then((res) => res.data);
};

// Remove a storage unit by ID
export const removeStorage = (
  storageId: string,
  clubAccountId: string,
) => {
  return api
    .delete(`/storage/removeStorage`, {
      params: {
        storage_id: storageId,
        club_account_id: clubAccountId,
      },
    })
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

export const updateStorageUnitLayouts = (
  storageUnits: StorageLayoutUpdateRequest[],
) => {
  return Promise.all(storageUnits.map((storageUnit) => createStorageUnit(storageUnit)));
};
