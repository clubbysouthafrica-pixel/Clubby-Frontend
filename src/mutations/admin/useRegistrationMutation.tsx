import { createRegistrationForm, archiveRegistration } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useCreateClubMutation = () => {
  return useMutation({
    mutationFn: createRegistrationForm
  });
}

export const useArchiveRegistrationMutation = () => {
  return useMutation({
    mutationFn: ({ user_id, registration_id }: { user_id: string; registration_id: string }) =>
      archiveRegistration(user_id, registration_id)
  });
}