import { updateClubDetails, updateCustomPaymentMethods } from "@/services/admin/club";
import { useMutation } from "@tanstack/react-query";

export const useUpdateClubDetailsMutation = () => {
    return useMutation({
        mutationFn: updateClubDetails
      });
    
}

export const useUpdateCustomPaymentMethodsMutation = () => {
    return useMutation({
        mutationFn: ({ clubAccountId, customPaymentMethods }: { clubAccountId: string; customPaymentMethods: Array<{ name: string; url: string }> }) =>
            updateCustomPaymentMethods(clubAccountId, customPaymentMethods)
    });
}