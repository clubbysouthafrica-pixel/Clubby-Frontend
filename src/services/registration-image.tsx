import { api } from "./api";

/**
 * Exchanges a stored registration-field image key (as returned inside a
 * registration field `value`, e.g. "club_123/abcd.jpg") for a temporary
 * viewable URL. Mirrors the existing `/images/presigned*` convention.
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
