import {Link} from "react-router-dom";
import {ForgotPasswordForm} from "@/components/forgot-password-form.tsx";
import Logo from "@/assets/logo.png"

export default function ForgotPasswordPage() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Link to="/" className="flex items-center gap-2 self-center font-medium">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground">
                       <img src={Logo} className="w-8 h-8" />
                    </div>
                    {import.meta.env.VITE_BRAND_NAME} Inc.
                </Link>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}
