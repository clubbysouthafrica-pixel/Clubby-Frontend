import { getMemberTransactions } from "@/services/admin/transactions"
import { useQuery } from "@tanstack/react-query"

export const useFetchMemberTransactions = (clubId: string, userId: string) => {
    return useQuery({
        queryKey: ['adminMemberTransactions', clubId, userId],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, userId] = queryKey;
            return getMemberTransactions(clubId, userId);
        },
        enabled: !!clubId && !!userId,
    })
}
