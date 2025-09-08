import {useContext} from "react";
import {AuthContext, AuthContextType} from "@/context/AuthContext.tsx";
import {MarketingLandingPage} from "@/pages/home/marketingPage.tsx";
import UserLandingPage from "@/pages/home/userLandingPage.tsx";

export default function HomePage() {
    const {user} = useContext(AuthContext) as AuthContextType
    return (
        !user ? <MarketingLandingPage/> : <UserLandingPage/>
    );
}