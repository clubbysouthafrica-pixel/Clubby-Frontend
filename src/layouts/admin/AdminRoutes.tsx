import { Navigate, Route, Routes } from "react-router-dom";
import MyClubsPage from "@/pages/member/my-clubs";
import ContactPage from "@/pages/public/contact-us";
import GetStartedPage from "@/pages/public/get-started";
import AboutPage from "@/pages/public/about";
import SettingsPage from "@/pages/shared-admin-&-member/user-settings";
import ProtectedRoute from "@/guards/ProtectedRoute.tsx";
import AdminRegistrationFormPage from "@/pages/admin/registrations/create-form";
import ManageClubDashboard from "@/pages/admin/club/manage-club";
import DashboardPage from "@/pages/admin/dashboard/dashboard";
import BillingPage from "@/pages/admin/billing/billing";
import GeneralReportingPage from "@/pages/admin/club/club-financials";
import AddMemberPage from "@/pages/admin/registrations/add-member";
import AddMembersBulkPage from "@/pages/admin/registrations/add-members-bulk";
import TermsPage from "@/pages/public/terms";
import PrivacyPage from "@/pages/public/privacy";
import ShopPage from "@/pages/admin/shop/shop";
import ProductsPage from "@/pages/admin/shop/products";
import OrdersPage from "@/pages/admin/shop/orders";
import AnalyticsPage from "@/pages/admin/shop/analytics";
import RegistrationsPage from "@/pages/admin/registrations/registrations";
import MembersPage from "@/pages/admin/user-management/members";
import VenuesPage from "@/pages/admin/booking/venues";
import BookingsPage from "@/pages/admin/booking/bookings";
import StorageAdmin from "@/pages/admin/storage/storage";
import StorageRequestsAdmin from "@/pages/admin/storage/storage-requests";
import EventsPage from "@/pages/admin/events/events";
import EventRegistrationsPage from "@/pages/admin/events/registrations";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";
import ClubHubPage from "@/pages/admin/hub/club-hub";
import MembersHubPage from "@/pages/admin/hub/members-hub";
import UserManagementHubPage from "@/pages/admin/hub/user-management-hub";
import ShopHubPage from "@/pages/admin/hub/shop-hub";
import EventsHubPage from "@/pages/admin/hub/events-hub";
import StorageHubPage from "@/pages/admin/hub/storage-hub";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />}></Route>
      <Route path="/register" element={<Navigate to="/" replace />}></Route>
      <Route
        path="/forgotpassword"
        element={<Navigate to="/" replace />}
      ></Route>
      <Route
        path="/resetpassword"
        element={<Navigate to="/" replace />}
      ></Route>
      <Route path="/otp" element={<Navigate to="/" replace />}></Route>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route path="/terms" element={<TermsPage />}></Route>
      <Route path="/privacy" element={<PrivacyPage />}></Route>
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
        path="/manage/users"
        element={<Navigate to="/manage/members" replace />}
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
        path="/manage/members/add-bulk"
        element={
          <ProtectedRoute>
            <AddMembersBulkPage />
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
        path="/reporting/general"
        element={
          <ProtectedRoute>
            <GeneralReportingPage />
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
      {isStorageFeatureEnabled && (
        <>
          <Route
            path="/storage-hub"
            element={
              <ProtectedRoute>
                <StorageHubPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/storage"
            element={
              <ProtectedRoute>
                <StorageAdmin />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/storage/requests"
            element={
              <ProtectedRoute>
                <StorageRequestsAdmin />
              </ProtectedRoute>
            }
          ></Route>
        </>
      )}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/events/registrations"
        element={
          <ProtectedRoute>
            <EventRegistrationsPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/club-hub"
        element={
          <ProtectedRoute>
            <ClubHubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/members-hub"
        element={
          <ProtectedRoute>
            <MembersHubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/user-management-hub"
        element={
          <ProtectedRoute>
            <UserManagementHubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/shop-hub"
        element={
          <ProtectedRoute>
            <ShopHubPage />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path="/events-hub"
        element={
          <ProtectedRoute>
            <EventsHubPage />
          </ProtectedRoute>
        }
      ></Route>
    </Routes>
  );
}
