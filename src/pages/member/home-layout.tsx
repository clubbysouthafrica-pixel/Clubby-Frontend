import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { useContext } from "react";
import UserLandingPage from "./home";
import MarketingHomePage from "./marketing-home-page";

export default function HomeLayout() {
  const { user } = useContext(AuthContext) as AuthContextType;

  return user ? <UserLandingPage /> : <MarketingHomePage />;
}
