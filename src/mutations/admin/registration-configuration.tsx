import { updateRegistrationConfiguration } from "@/services/admin/registration-configuration";
import { useMutation } from "@tanstack/react-query";

export const useUpdateRegistrationConfigurationMutation = () => {
  return useMutation({
    mutationFn: updateRegistrationConfiguration,
  });
};
