import { LoginForm } from "@/components/login-form.tsx";
import Logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6 md:p-10">
      <div>
        <Link to="/" className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-white/80 shadow flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground">
            <img src={Logo} className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">
            {import.meta.env.VITE_BRAND_NAME} Inc.
          </span>
        </Link>
        <LoginForm />
        <div className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {import.meta.env.VITE_BRAND_NAME}.
          All rights reserved.
        </div>
      </div>
    </div>
  );
}
