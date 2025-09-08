import { updateAdminProfileService } from "@/services/admin/profile";
import { onboardProfileService, updateProfileService } from "@/services/profile";
import { useMutation } from "@tanstack/react-query";

export const useUpdateProfileMutation = (isAdmin: boolean) => {
    return useMutation({
        mutationFn: isAdmin ? updateAdminProfileService : updateProfileService
    });
}

export const useOnboardProfileMutation = () => {
    return useMutation({
        mutationFn: onboardProfileService
    });
}