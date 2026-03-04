import { Link } from "react-router-dom";
import { ForgotPasswordForm } from "@/components/forgot-password-form.tsx";
import Logo from "@/assets/logo.png";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground">
            <img src={Logo} className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">
            {import.meta.env.VITE_BRAND_NAME} Inc.
          </span>
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
