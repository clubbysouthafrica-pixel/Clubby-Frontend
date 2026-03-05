import { fetchClubGallery } from "@/services/gallery";
import { useQuery } from "@tanstack/react-query";

export const useFetchClubGallery = (
  clubId: string,
  maxKeys: number = 20,
  continuationToken?: string,
) => {
  return useQuery({
    queryKey: ["club/gallery", clubId, maxKeys, continuationToken],
    queryFn: ({ queryKey }) => {
      const [_, clubId, maxKeys, continuationToken] = queryKey;
      return fetchClubGallery(
        clubId as string,
        maxKeys as number,
        continuationToken as string,
      );
    },
    enabled: !!clubId,
  });
};
