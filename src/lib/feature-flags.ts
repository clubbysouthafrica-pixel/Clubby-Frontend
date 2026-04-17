const storageOverride = import.meta.env.VITE_ENABLE_STORAGE;

export const isStorageFeatureEnabled =
  typeof storageOverride === "string"
    ? storageOverride.toLowerCase() === "true"
    : import.meta.env.VITE_ENVIRONMENT !== "Prod";