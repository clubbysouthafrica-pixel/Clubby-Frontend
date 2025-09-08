import { getAdminProfileService } from "@/services/admin/profile";
import { getProfileService } from "@/services/profile";
import { useQuery } from "@tanstack/react-query";

export const useGetProfileQuery = (isAdmin: boolean) => {
    return useQuery({
      queryKey: ['getUserProfile'],
      queryFn: isAdmin ? getAdminProfileService : getProfileService,
    });
  };