import { createMemberRegistrationForm } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useMemberRegistrationMutation = () => {
    return useMutation({
        mutationFn: createMemberRegistrationForm
    });
}