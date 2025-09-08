import { api } from "./api";

export const clubProfileImagePresignedUrl = (clubId: string) => `/images/presignedClubProfileUrl?club_account_id=${clubId}`
export const clubCoverImagePresignedUrl = (clubAccountId: string) => `/images/presignedClubCoverUrl?club_account_id=${clubAccountId}`
export const memberProfilePresignedUrl = "/images/presignedUserProfileUrl"
export const fetchImagePresignedUrl = (url: string) => {
    return api.get(url)
        .then(res => res.data);
} 