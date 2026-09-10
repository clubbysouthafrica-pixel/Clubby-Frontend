import { api } from "./api";

/**
 * Admin-side counterpart of `resolveRegistrationFieldImageUrl` in
 * `@/services/registration-image` - exchanges a stored registration-field image
 * key for a temporary viewable URL. Mirrors the `/images/presigned*` convention.
 *
 * Backend is expected to respond with one of: { url }, { fetchUrl }, { fetch_url }.
 */
export const fetchRegistrationFieldImageUrl = (
  clubAccountId: string,
  key: string,
): Promise<{ url?: string; fetchUrl?: string; fetch_url?: string }> => {
  return api
    .get(
      `/images/presignedRegistrationFieldUrl?club_account_id=${encodeURIComponent(
        clubAccountId,
      )}&key=${encodeURIComponent(key)}`,
    )
    .then((res) => res.data);
};

export const resolveRegistrationFieldImageUrl = async (
  clubAccountId: string,
  key: string,
): Promise<string | null> => {
  try {
    const data = await fetchRegistrationFieldImageUrl(clubAccountId, key);
    return data.url ?? data.fetchUrl ?? data.fetch_url ?? null;
  } catch {
    return null;
  }
};
