import { Route, Routes } from "react-router-dom";
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
import AdminRegistrationFormPage from "@/pages/registrations/admin-registration-form-page";
import ManageClubDashboard from "@/pages/dashboard/clubs/manage-club";
import ManagePage from "@/pages/dashboard/manage/manage";
import HomeDashboardPage from "@/pages/dashboard/dash-home";
import RegistrationReportPage from "@/pages/admin/reporting/registration-report-page";
import BillingPage from "@/pages/admin/billing/billing";
import GeneralReportingPage from "@/pages/admin/reporting/general-reporting";
import ShopReportingPage from "@/pages/admin/reporting/shop-reporting";
import FinancialTransactionsPage from "@/pages/admin/reporting/financial-transactions";
import OnboardClubPage from "@/pages/authentication/onboard-club";
import AddMemberPage from "@/pages/admin/members/add-member/add-member";
import LoginPage from "@/pages/authentication/login/page";
import TermsPage from "@/pages/policies/terms";
import PrivacyPage from "@/pages/policies/privacy";
import AdminPolicyPage from "@/pages/registrations/admin-policy-page";
import ShopPage from "@/pages/admin/shop/shop";
import ProductsPage from "@/pages/admin/shop/products";
import OrdersPage from "@/pages/admin/shop/orders";
import AnalyticsPage from "@/pages/admin/shop/analytics";
import RegistrationsPage from "@/pages/admin/members/registrations/registrations";
import MembersPage from "@/pages/admin/members/members/members";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeDashboardPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route path="/terms" element={<TermsPage />}></Route>
      <Route path="/privacy" element={<PrivacyPage />}></Route>
      <Route path="/login" element={<LoginPage />}></Route>
      <Route path="/register" element={<RegisterPage />}></Route>
      <Route path="/forgotpassword" element={<ForgotPasswordPage />}></Route>
      <Route path="/resetpassword" element={<PasswordResetPage />}></Route>
      <Route path="/otp" element={<OTPPage />}></Route>
      <Route path="/about" element={<AboutPage />}></Route>
      <Route path="/getstarted" element={<GetStartedPage />}></Route>
      <Route path="/contactus" element={<ContactPage />}></Route>
      <Route path="/onboard" element={<OnboardClubPage />}></Route>

      <Route
        path="/myclubs"
        element={
          <ProtectedRoute>
            <MyClubsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
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
        path="/billing&usage"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      ></Route>

      <Route
        path="/manage"
        element={
          <ProtectedRoute>
            <ManagePage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/members"
        element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/member/registrations"
        element={
          <ProtectedRoute>
            <RegistrationsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/members/add"
        element={
          <ProtectedRoute>
            <AddMemberPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/club"
        element={
          <ProtectedRoute>
            <ManageClubDashboard />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/registrations/forms"
        element={
          <ProtectedRoute>
            <AdminRegistrationFormPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/manage/registrations/policy"
        element={
          <ProtectedRoute>
            <AdminPolicyPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/reporting/registration"
        element={
          <ProtectedRoute>
            <RegistrationReportPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/reporting/general"
        element={
          <ProtectedRoute>
            <GeneralReportingPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/reporting/shop"
        element={
          <ProtectedRoute>
            <ShopReportingPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/reporting/transactions"
        element={
          <ProtectedRoute>
            <FinancialTransactionsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <ShopPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/shop/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/shop/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/shop/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      ></Route>
    </Routes>
  );
}
