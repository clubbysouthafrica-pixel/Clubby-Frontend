import { fetchAdminClubs } from "@/services/admin/admin-clubs"
import { fetchClub, fetchClubDetails, type FetchClubOptions } from "@/services/admin/club";
import { useQuery } from "@tanstack/react-query"

export const useFetchAdminClubs = () => {
    return useQuery({
        queryKey: ['adminClubs'],
        queryFn: fetchAdminClubs,
      })
}

export const useFetchClub = (clubAccountId: string, options?: FetchClubOptions) => {
    return useQuery({
      queryKey: ['getClub', clubAccountId, options?.includeImages, options?.stats],
      queryFn: ({ queryKey }) => {
        const [, clubId] = queryKey;
        return fetchClub(clubId as string, options);
      },
      enabled: !!clubAccountId,
    });
}

export const useFetchClubDetails = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['getClubDetails', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [, clubId] = queryKey;
      return fetchClubDetails(clubId);
    },
    enabled: !!clubAccountId,
  });
}