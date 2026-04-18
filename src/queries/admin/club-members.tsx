import { fetchClubMembers } from "@/services/admin/club-members";
import { useQuery } from "@tanstack/react-query";

export const useFetchClubMembers = (
    clubId: string,
    activeKeys?: string[],
    memberType?: string,
    limit?: number,
    pageToken?: string,
    memberName?: string,
    memberId?: string,
    customFilters?: Array<{
        field_id: string;
        type: string;
        input_type: string;
        value: string;
        condition?: string;
    }>,
    page?: string,
    showArchived?: boolean,
) => {
    const resolvedLimit = limit || 5;

    const query = useQuery({
        queryKey: [
            "adminClubMembers",
            clubId,
            activeKeys,
            memberType,
            resolvedLimit,
            pageToken,
            memberName,
            memberId,
            customFilters,
            page,
            showArchived,
        ],
        queryFn: ({ queryKey }) => {
            const [
                _key,
                currentClubId,
                currentActiveKeys,
                currentMemberType,
                currentLimit,
                currentPageToken,
                currentMemberName,
                currentMemberId,
                currentCustomFilters,
                currentPage,
                currentShowArchived,
            ] = queryKey as [
                string,
                string,
                string[] | undefined,
                string | undefined,
                number,
                string | undefined,
                string | undefined,
                string | undefined,
                | Array<{
                        field_id: string;
                        type: string;
                        input_type: string;
                        value: string;
                        condition?: string;
                    }>
                | undefined,
                string | undefined,
                boolean | undefined,
            ];

            return fetchClubMembers(
                currentClubId,
                currentActiveKeys,
                currentMemberType,
                currentLimit,
                currentPageToken,
                currentMemberName,
                currentMemberId,
                currentCustomFilters,
                currentPage,
                currentShowArchived,
            );
        },
        enabled: !!clubId,
        retry: false,
    });

    return {
        ...query,
        refetch: query.refetch,
    };
};
