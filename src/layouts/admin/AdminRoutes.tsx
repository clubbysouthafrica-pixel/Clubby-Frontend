import { Route, Routes } from "react-router-dom";
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
import AdminRegistrationFormPage from "@/pages/admin/registration-form/create-form";
import ManageClubDashboard from "@/pages/admin/club/manage-club";
import HomeDashboardPage from "@/pages/admin/club/home";
import RegistrationReportPage from "@/pages/admin/reporting/registration-report-page";
import BillingPage from "@/pages/admin/billing/billing";
import GeneralReportingPage from "@/pages/admin/reporting/general-reporting";
import ShopReportingPage from "@/pages/admin/reporting/shop-reporting";
import FinancialTransactionsPage from "@/pages/admin/reporting/financial-transactions";
import AddMemberPage from "@/pages/admin/members/add-member/add-member";
import LoginPage from "@/pages/public/login/login";
import TermsPage from "@/pages/public/terms";
import PrivacyPage from "@/pages/public/privacy";
import ShopPage from "@/pages/admin/shop/shop";
import ProductsPage from "@/pages/admin/shop/products";
import OrdersPage from "@/pages/admin/shop/orders";
import AnalyticsPage from "@/pages/admin/shop/analytics";
import RegistrationsPage from "@/pages/admin/members/registrations/registrations";
import MembersPage from "@/pages/admin/members/members/members";
import VenuesPage from "@/pages/admin/venues-&-bookings/venues";
import BookingsPage from "@/pages/admin/venues-&-bookings/bookings";

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

      <Route
        path="/myclubs"
        element={
          <ProtectedRoute>
            <MyClubsPage />
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
      <Route
        path="/venues"
        element={
          <ProtectedRoute>
            <VenuesPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/venues/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      ></Route>
    </Routes>
  );
}
