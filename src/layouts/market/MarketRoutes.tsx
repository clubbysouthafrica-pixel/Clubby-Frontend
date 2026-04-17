import { Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/public/login/login";
import RegisterPage from "@/pages/public/login/register/page";
import MyClubsPage from "@/pages/member/my-clubs";
import OTPPage from "@/pages/public/login/otp/page";
import ContactPage from "@/pages/public/contact-us";
import GetStartedPage from "@/pages/public/get-started";
import AboutPage from "@/pages/public/about";
import ForgotPasswordPage from "@/pages/public/login/password/PasswordResetRequest";
import PasswordResetPage from "@/pages/public/login/password/PasswordReset";
import SettingsPage from "@/pages/shared-admin-&-member/user-settings";
import ProtectedRoute from "@/guards/ProtectedRoute.tsx";
import ViewClubPage from "@/pages/shared-public-&-member/view-club";
import MemberShopPage from "@/components/member/shop/shop";
import EventRegistrationPage from "@/components/member/events/event-registration-page";
import OnboardMember from "@/pages/member/onboard-member";
import AdminRegistrationFormPage from "@/pages/admin/registration-form/create-form";
import BrowseClubsPage from "@/pages/public/browse-clubs";
import PublicJoinRegisterPage from "@/pages/public/public-join-register";
import ActivateAccount from "@/pages/public/login/temporary-password/ActivateAccount";
import { ClubRegisterForm } from "@/components/member/register/registration_form";
import TermsPage from "@/pages/public/terms";
import PrivacyPage from "@/pages/public/privacy";
import RegistrationPolicy from "@/pages/public/privacy-clubs";
import ResetTemporaryPasswordPage from "@/pages/public/login/reset-temporary-password/page";
import HomeLayout from "@/pages/member/home-layout";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";

export default function MarketRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}></Route>
      <Route path="/terms" element={<TermsPage />}></Route>
      <Route path="/privacy" element={<PrivacyPage />}></Route>
      <Route path="/legal" element={<RegistrationPolicy />}></Route>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route
        path="/login/reset-email"
        element={<ResetTemporaryPasswordPage />}
      ></Route>
      <Route path="/register" element={<RegisterPage />}></Route>
      <Route path="/forgotpassword" element={<ForgotPasswordPage />}></Route>
      <Route path="/activateAccount" element={<ActivateAccount />}></Route>
      <Route path="/resetpassword" element={<PasswordResetPage />}></Route>
      <Route path="/otp" element={<OTPPage />}></Route>
      <Route path="/about" element={<AboutPage />}></Route>
      <Route path="/getstarted" element={<GetStartedPage />}></Route>
      <Route path="/contactus" element={<ContactPage />}></Route>
      <Route
        path="/onboardMember"
        element={
          <ProtectedRoute>
            <OnboardMember />
          </ProtectedRoute>
        }
      ></Route>

      <Route path="/clubs" element={<BrowseClubsPage />}></Route>
      <Route path="/clubs/:clubId" element={<ViewClubPage />}></Route>
      <Route
        path="/clubs/:clubId/public/register"
        element={<PublicJoinRegisterPage />}
      ></Route>
      <Route
        path="/clubs/:clubId/register"
        element={
          <ProtectedRoute>
            <ClubRegisterForm />
          </ProtectedRoute>
        }
      ></Route>

      <Route
        path="/myclubs"
        element={
          <ProtectedRoute>
            <MyClubsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/shop"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/store"
        element={
          <ProtectedRoute>
            <MemberShopPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/payments"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/registration"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>

      {isStorageFeatureEnabled && (
        <Route
          path="/myclubs/:clubId/storage"
          element={
            <ProtectedRoute>
              <ViewClubPage />
            </ProtectedRoute>
          }
        ></Route>
      )}
      <Route
        path="/myclubs/:clubId/bookings"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/events"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/events/:eventId/register"
        element={
          <ProtectedRoute>
            <EventRegistrationPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/myclubs/:clubId/invite"
        element={
          <ProtectedRoute>
            <ViewClubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/registrations/forms"
        element={
          <>
            <AdminRegistrationFormPage />
          </>
        }
      ></Route>
    </Routes>
  );
}
