import { getMemberTransactions, getClubTransactions } from "@/services/admin/transactions"
import { useQuery } from "@tanstack/react-query"
import { useRef, useEffect } from "react"

export const useFetchMemberTransactions = (clubId: string, userId: string, limit?: number, pageToken?: string) => {
    const limitRef = useRef(limit || 25);
    const pageTokenRef = useRef<string | undefined>(pageToken);
    
    useEffect(() => {
        limitRef.current = limit || 25;
    }, [limit]);

    useEffect(() => {
        pageTokenRef.current = pageToken;
    }, [pageToken]);

    return useQuery({
        queryKey: ['adminMemberTransactions', clubId, userId, limit, pageToken],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, userId] = queryKey as [string, string, string];
            return getMemberTransactions(clubId, userId, limitRef.current, pageTokenRef.current);
        },
        enabled: !!clubId && !!userId,
        retry: false,
    })
}

export const useFetchClubTransactions = (clubId: string, limit?: number, pageToken?: string, filters?: { transaction_id?: string; member_id?: string; transaction_type?: string; status?: string }) => {
    const limitRef = useRef(limit || 25);
    const pageTokenRef = useRef<string | undefined>(pageToken);
    
    useEffect(() => {
        limitRef.current = limit || 25;
    }, [limit]);

    useEffect(() => {
        pageTokenRef.current = pageToken;
    }, [pageToken]);

    return useQuery({
        queryKey: ['adminClubTransactions', clubId, limit, pageToken, filters],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, _limit, _pageToken, filters] = queryKey as [string, string, number | undefined, string | undefined, { transaction_id?: string; member_id?: string; transaction_type?: string; status?: string } | undefined];
            return getClubTransactions(clubId, limitRef.current, pageTokenRef.current, filters);
        },
        enabled: !!clubId,
        retry: false,
    })
}
