import { api } from "./api";

export const fetchClubGallery = (
  clubId: string,
  maxKeys: number = 20,
  continuationToken?: string,
) => {
  const params = new URLSearchParams({
    clubId,
    maxKeys: maxKeys.toString(),
  });
  if (continuationToken) {
    params.append("continuationToken", continuationToken);
  }
  return api.get(`/club/gallery?${params.toString()}`).then((res) => res.data);
};
