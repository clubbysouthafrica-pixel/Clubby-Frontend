import { updateClubDetails } from "@/services/admin/club";
import { useMutation } from "@tanstack/react-query";

export const useUpdateClubDetailsMutation = () => {
    return useMutation({
        mutationFn: updateClubDetails
      });
    
}