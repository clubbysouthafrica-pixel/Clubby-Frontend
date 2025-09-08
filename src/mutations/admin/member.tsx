import { registerMemberToClub } from "@/services/admin/club-members";
import { useMutation } from "@tanstack/react-query";

export const useRegisterUserToClubMutation = () => {
    return useMutation({
        mutationFn: registerMemberToClub
      });
    
}