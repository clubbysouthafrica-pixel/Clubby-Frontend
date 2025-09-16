import { useContext } from "react";
import { AuthContext, AuthContextType } from "@/context/AuthContext.tsx";
import { MarketingLandingPage } from "@/pages/home/marketingPage.tsx";
import UserLandingPage from "@/pages/home/userLandingPage.tsx";
import ProtectedRoute from "@/guards/ProtectedRoute.tsx";

export default function HomePage() {
    const { user } = useContext(AuthContext) as AuthContextType
    return (
        !user ? <MarketingLandingPage /> : <ProtectedRoute><UserLandingPage /></ ProtectedRoute>
            );
}