import { registerMemberToClub, removeMember } from "@/services/admin/club-members";
import { useMutation } from "@tanstack/react-query";

export const useRegisterUserToClubMutation = () => {
    return useMutation({
        mutationFn: registerMemberToClub
      });
    
}

export const useRemoveMemberMutation = () => {
    return useMutation({
        mutationFn: ({ clubAccountId, memberIds }: { clubAccountId: string; memberIds: string[] }) =>
            removeMember(clubAccountId, memberIds)
    });
}