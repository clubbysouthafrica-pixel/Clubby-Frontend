import { fetchClub, fetchClubBankDetails, listClubs } from "@/services/club";
import { useQuery } from "@tanstack/react-query"

export const useFetchClubsQuery = () => {
  return useQuery({
    queryKey: ['listClubs'],
    queryFn: listClubs,
  });
};

export const useFetchClub = (clubAccountId: string, enabled = true) => {
    return useQuery({
      queryKey: ['getClub', clubAccountId],
      queryFn: ({ queryKey }) => {
        const [_key, clubId] = queryKey;
        return fetchClub(clubId);
      },
      enabled: enabled && !!clubAccountId,
    });
}

export const useFetchClubBankDetails = (clubAccountId: string, isRegistered: boolean) => {
  return useQuery({
    queryKey: ['getClubBankDetails', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchClubBankDetails(clubId);
    },
    enabled: !!clubAccountId && isRegistered,
  });
}