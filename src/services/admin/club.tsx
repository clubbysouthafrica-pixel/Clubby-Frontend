import { ClubDetailsRequest } from "@/requests/club-request";
import { api } from "./api";

export const fetchClub = (clubAccountId: string, options?: { includeImages?: boolean }): Promise<any> => {
    let url = `/club/getClub?club_account_id=${clubAccountId}`;
    if (options?.includeImages) {
        url += `&includeImages=true`;
    }
    return api.get(url)
        .then(res => res.data);
} 

export const listClubs = () => {
    return api.get(`/club/getAllClubs`)
        .then(res => res.data)
}

export const fetchClubDetails = (clubId: string) => {
    return api.get(`/club/getClubDetails?club_account_id=${clubId}`).then(res => res.data)
}

export const updateClubDetails = (clubDetailsRequest: ClubDetailsRequest) => {
    return api.post("club/updateClubDetails", clubDetailsRequest).then(res => res.data)
}

export const updateCustomPaymentMethods = (clubAccountId: string, customPaymentMethods: Array<{ name: string; url: string }>) => {
    return api.post("club/updateCustomPaymentMethods", {
        club_account_id: clubAccountId,
        custom_payment_methods: customPaymentMethods
    }).then(res => res.data)
}

export const uploadGalleryImage = (clubAccountId: string, galleryImage: string, imageId: string) => {
    return api.post("club/uploadGalleryImage", {
        club_account_id: clubAccountId,
        gallery_image: galleryImage,
        image_id: imageId
    }).then(res => res.data)
}

export const removeGalleryImage = (clubAccountId: string, imageId: string) => {
    return api.post("club/removeGalleryImage", {
        club_account_id: clubAccountId,
        image_id: imageId
    }).then(res => res.data)
}