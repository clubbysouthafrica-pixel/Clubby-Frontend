import { SendEmailRequest } from "@/interfaces/Emailer";
import { api } from "./api";

export const useSendEmail = (request: SendEmailRequest) => {
    return api.post("/mailer/processEmails", request)
        .then(res => res.data);
} 