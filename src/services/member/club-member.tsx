import { api } from "../api";

export type MemberClubAssociation = {
  email_opt_in?: boolean;
  is_club_member?: boolean;
  message?: string;
};

export const getMemberClubAssociation = (
  clubAccountId: string,
  memberUserId: string,
): Promise<MemberClubAssociation> => {
  return api
    .get(
      `/clubMember/getClubMember?club_account_id=${clubAccountId}&member_user_id=${memberUserId}`,
    )
    .then((res) => res.data as MemberClubAssociation);
};

export const updateMemberEmailOptIn = (
  clubAccountId: string,
  emailOptIn: boolean,
): Promise<unknown> => {
  return api
    .post("/clubMember/updateClubMember", {
      club_account_id: clubAccountId,
      email_opt_in: emailOptIn,
    })
    .then((res) => res.data);
};
