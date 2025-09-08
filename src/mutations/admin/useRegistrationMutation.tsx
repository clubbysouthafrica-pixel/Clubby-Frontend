import { createRegistrationForm } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useCreateClubMutation = () => {
  return useMutation({
    mutationFn: createRegistrationForm
  });
}