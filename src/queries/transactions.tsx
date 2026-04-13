import { getUserTransactions } from "@/services/transactions"
import { useQuery } from "@tanstack/react-query"

export const useFetchUserTransactions = (clubId: string, userId: string, enabled = true) => {
    return useQuery({
        queryKey: ['adminMemberTransactions', clubId, userId],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, userId] = queryKey;
            return getUserTransactions(clubId, userId);
        },
        enabled: enabled && !!clubId && !!userId,
    })
}
