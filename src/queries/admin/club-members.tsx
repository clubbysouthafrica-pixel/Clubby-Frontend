import { fetchClubMembers } from "@/services/admin/club-members"
import { useQuery } from "@tanstack/react-query"
import { useRef, useEffect } from "react"

export const useFetchClubMembers = (clubId: string, activeKeys?: string[], memberType?: string, limit?: number, pageToken?: string, memberName?: string, memberId?: string, customFilters?: Array<{ field_id: string; type: string; input_type: string; value: string; condition?: string }>, page?: string, showArchived?: boolean) => {
    const limitRef = useRef(limit || 5);
    const pageTokenRef = useRef<string | undefined>(pageToken);
    
    useEffect(() => {
        limitRef.current = limit || 5;
    }, [limit]);

    useEffect(() => {
        pageTokenRef.current = pageToken;
    }, [pageToken]);

    const query = useQuery({
        queryKey: ['adminClubMembers', clubId, activeKeys, memberType, memberName, memberId, customFilters, page, showArchived],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, activeKeys, memberType, memberName, memberId, customFilters, page, showArchived] = queryKey as [string, string, string[] | undefined, string | undefined, string | undefined, string | undefined, Array<{ field_id: string; type: string; input_type: string; value: string; condition?: string }> | undefined, string | undefined, boolean | undefined];
            return fetchClubMembers(clubId, activeKeys, memberType, limitRef.current, pageTokenRef.current, memberName, memberId, customFilters, page, showArchived);
          },
        enabled: !!clubId,
        retry: false,
      })
    return {
        ...query,
        refetch: query.refetch,
    }
}
