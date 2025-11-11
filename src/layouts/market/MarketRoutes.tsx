import {Route, Routes} from "react-router-dom";
import HomePage from "@/pages/home/page.tsx";
import LoginPage from "@/pages/authentication/login/page.tsx";
import RegisterPage from "@/pages/authentication/register/page.tsx";
import MyClubsPage from "@/pages/clubs/my-clubs.tsx";
import OTPPage from "@/pages/authentication/otp/page.tsx";
import ProfilePage from "@/pages/profile/page.tsx";
import ContactPage from "@/pages/contact/page.tsx";
import GetStartedPage from "@/pages/getstarted/page.tsx";
import AboutPage from "@/pages/about/about.tsx";
import ForgotPasswordPage from "@/pages/authentication/password/PasswordResetRequest.tsx";
import PasswordResetPage from "@/pages/authentication/password/PasswordReset.tsx";
import SettingsPage from "@/pages/profile/settings.tsx";
import ProtectedRoute from "@/guards/ProtectedRoute.tsx";
import ViewClubPage from "@/pages/clubs/view-club.tsx";
import OnboardMember from "@/pages/authentication/onboard-member";
import AdminRegistrationFormPage from "@/pages/registrations/admin-registration-form-page";
import BrowseClubsPage from "@/pages/clubs/browse-clubs";
import PublicJoinRegisterPage from "@/pages/clubs/public-join-register";
import ActivateAccount from "@/pages/authentication/temporary-password/ActivateAccount";
import { ClubRegisterForm } from "@/components/member/register/registration_form";
export default function MarketRoutes() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/admin/login" element={<LoginPage />}></Route>
            <Route path="/register" element={<RegisterPage />}></Route>
            <Route path="/forgotpassword" element={<ForgotPasswordPage />}></Route>
            <Route path="/activateAccount" element={<ActivateAccount />}></Route>
            <Route path="/resetpassword" element={<PasswordResetPage />}></Route>
            <Route path="/otp" element={<OTPPage />}></Route>
            <Route path="/about" element={<AboutPage />}></Route>
            <Route path="/getstarted" element={<GetStartedPage />}></Route>
            <Route path="/contactus" element={<ContactPage />}></Route>
            <Route path="/onboardMember" element={<ProtectedRoute><OnboardMember /></ProtectedRoute>}></Route>

            <Route path="/clubs" element={<BrowseClubsPage />}></Route>
            <Route path="/clubs/:clubId" element={<ViewClubPage />}></Route>
            <Route path="/clubs/:clubId/public/register" element={<PublicJoinRegisterPage />}></Route>
            <Route path="/clubs/:clubId/register" element={<ProtectedRoute><ClubRegisterForm /></ProtectedRoute>}></Route>

            <Route path="/myclubs" element={<ProtectedRoute><MyClubsPage /></ProtectedRoute>}></Route>
            <Route path="/myclubs/:clubId" element={<ProtectedRoute><ViewClubPage /></ProtectedRoute>}></Route>
            <Route path="/myclubs/:clubId/invite" element={<ProtectedRoute><ViewClubPage /></ProtectedRoute>}></Route>
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}></Route>
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}></Route>
            <Route path="/manage/registrations/forms" element={<><AdminRegistrationFormPage /></>}></Route>
        </Routes>
    )
}
