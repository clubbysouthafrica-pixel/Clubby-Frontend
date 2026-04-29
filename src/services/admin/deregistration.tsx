import { api } from "./api";

export const checkDeregistrationShop = (clubAccountId: string) => {
  if (!clubAccountId) {
    throw new Error("clubAccountId is required");
  }

  return api.get(`/deregistration/shop?club_account_id=${clubAccountId}`, {
    validateStatus: (status) => status >= 200 && status < 300,
  });
};

export const checkDeregistrationRegistration = (clubAccountId: string) => {
  if (!clubAccountId) {
    throw new Error("clubAccountId is required");
  }

  return api.get(`/deregistration/registration?club_account_id=${clubAccountId}`, {
    validateStatus: (status) => status >= 200 && status < 300,
  });
};

export const checkDeregistrationEvents = (clubAccountId: string) => {
  if (!clubAccountId) {
    throw new Error("clubAccountId is required");
  }

  return api.get(`/deregistration/events?club_account_id=${clubAccountId}`, {
    validateStatus: (status) => status >= 200 && status < 300,
  });
};