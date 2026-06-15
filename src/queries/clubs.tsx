import { fetchClub, fetchClubBankDetails, fetchPaymentDetails, listClubs } from "@/services/club";
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
      staleTime: 5 * 60 * 1000,
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

export const useFetchPaymentDetails = (clubAccountId: string, enabled = true) => {
  return useQuery({
    queryKey: ['getPaymentDetails', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchPaymentDetails(clubId);
    },
    enabled: enabled && !!clubAccountId,
  });
}