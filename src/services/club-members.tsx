import { api } from "./admin/api";

export interface GetClubMemberResponse {
  user?: {
    phone_number?: string;
    email?: string;
    first_name?: string;
    surname?: string;
  };
  is_club_member?: boolean;
  registration?: string | null;
  registration_id?: string;
  message?: string;
  email_opt_in?: boolean;
}

export const getClubMember = (
  clubAccountId: string,
  memberUserId: string,
): Promise<GetClubMemberResponse> => {
  return api
    .get(
      `/clubMember/getClubMember?club_account_id=${clubAccountId}&member_user_id=${memberUserId}`,
    )
    .then((res) => res.data as GetClubMemberResponse);
};
