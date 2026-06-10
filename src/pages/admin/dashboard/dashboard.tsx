import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { HomeSectionCards } from "@/components/admin/dashboard/section-cards";
import {
  ArrowRight,
  BoxIcon,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Settings,
  ShoppingBag,
  UserCog,
  XCircle,
} from "lucide-react";
import { useFetchAdminClubs, useFetchClub } from "@/queries/admin/clubs";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";
import DeregisterSeasonDialog from "@/components/admin/registrations/features/deregister-season";

export default function DashboardPage() {
  const {
    club,
    setClub,
    isLoading: clubLoading,
  } = useContext(ClubContext) as ClubContextType;
  const clubAccountId = club?.club_account_id ?? "";
  const { data: adminClubsResponse } = useFetchAdminClubs();
  const { data: fetchedClub, isLoading: fetchedClubLoading } = useFetchClub(
    clubAccountId,
    { includeAccountBalance: true, stats: true },
  );
  const adminClubItems = adminClubsResponse?.data?.items ?? [];
  const activeAdminClub = adminClubItems.find(
    (item: { club_account_id?: string }) =>
      item.club_account_id === clubAccountId,
  );
  const currentClub = useMemo(
    () => ({
      ...club,
      ...activeAdminClub,
      ...fetchedClub,
      access: activeAdminClub?.access ?? club?.access,
    }),
    [activeAdminClub, fetchedClub, club],
  );
  const navigate = useNavigate();
  const isStageRestrictedClub =
    import.meta.env.VITE_ENVIRONMENT === "Stage" &&
    clubAccountId === "club_1779873109284_101715";

  const featureStatus = useMemo(
    () => [
      {
        label: "Shop",
        enabled: Boolean(currentClub?.enable_shop),
        route: "/shop-hub",
      },
      {
        label: "Events",
        enabled: Boolean(currentClub?.enable_events),
        route: "/events-hub",
      },
      {
        label: "Storage",
        enabled: Boolean(currentClub?.enable_storage),
        route: "/storage-hub",
      },
      {
        label: "Booking",
        enabled: Boolean(currentClub?.venues_enabled),
        route: "/venues",
      },
    ],
    [currentClub],
  );

  const portalSections = useMemo(
    () =>
      [
        {
          title: "Club",
          description: "Manage club details, settings and financial overview.",
          icon: Settings,
          items: [
            { title: "Manage Club", route: "/manage/club" },
            { title: "Club Financials", route: "/reporting/general" },
          ],
        },
        {
          title: "User Management",
          description: "View and manage current club members.",
          icon: UserCog,
          items: [{ title: "Members", route: "/manage/members" }],
        },
        {
          title: "Registrations",
          description: "Review registrations and manage registration forms.",
          icon: ClipboardList,
          items: [
            { title: "Registrations", route: "/manage/member/registrations" },
            { title: "Register a Member", route: "/manage/members/add" },
            { title: "Registration Form", route: "/manage/registrations/forms" },
          ],
        },
        {
          title: "Shop",
          description: "Manage products and orders for the club shop.",
          icon: ShoppingBag,
          items: [
            { title: "Products", route: "/shop/products" },
            { title: "Orders", route: "/shop/orders" },
          ],
        },
        {
          title: "Booking",
          description: "Configure venues and manage booking activity.",
          icon: MapPin,
          items: [{ title: "Venues & Bookings", route: "/venues" }],
        },
        {
          title: "Events",
          description: "Create events and monitor event registrations.",
          icon: CalendarDays,
          items: [
            { title: "Events", route: "/events" },
            { title: "Registrations", route: "/events/registrations" },
          ],
        },
        {
          title: "Storage",
          description: "Manage storage units and review storage requests.",
          icon: BoxIcon,
          items: [
            { title: "Storage", route: "/storage" },
            { title: "Storage Requests", route: "/storage/requests" },
          ],
        },
      ].filter(
        (section) =>
          section.title !== "Storage" ||
          (isStorageFeatureEnabled && Boolean(currentClub?.enable_storage)),
      ),
    [currentClub],
  );

  const enabledFeatures = featureStatus.filter((f) => f.enabled);
  const disabledFeatures = featureStatus.filter((f) => !f.enabled);

  useEffect(() => {
    if (fetchedClub && club) {
      const nextClub = {
        ...club,
        ...activeAdminClub,
        ...fetchedClub,
        access: activeAdminClub?.access ?? club.access,
      };
      if (JSON.stringify(nextClub) !== JSON.stringify(club)) {
        setClub(nextClub);
      }
    }
  }, [activeAdminClub, fetchedClub, club, setClub]);

  const isInitialLoad =
    clubLoading ||
    !clubAccountId ||
    fetchedClubLoading ||
    !currentClub?.club_account_id;

  if (isInitialLoad) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="w-full px-3 py-3 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between md:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {currentClub?.club_name}
              </h1>
              <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 sm:gap-4 sm:text-sm">
                <span>Season: <span className="font-medium text-slate-900">{currentClub?.season_cycle ?? "-"}</span></span>
                <span>Type: <span className="font-medium text-slate-900">{currentClub?.club_type}</span></span>
                <span>Currency: <span className="font-medium text-slate-900">{currentClub?.currency}</span></span>
                <span>Access: <span className="font-medium text-slate-900">{currentClub?.access}</span></span>
              </div>
            </div>
            {!isStageRestrictedClub && (
              <div className="flex shrink-0 items-center">
                <DeregisterSeasonDialog clubId={currentClub?.club_account_id ?? ""} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6">
        <section className="space-y-2.5 sm:space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">Membership</h2>
            <p className="hidden text-sm text-slate-600 sm:block">Current season totals from the club summary.</p>
          </div>
          <HomeSectionCards
            totalActiveMembers={currentClub?.total_active_members}
            totalPendingMembers={currentClub?.total_pending_members}
            onActiveMembersClick={() =>
              navigate("/manage/member/registrations?tab=registered-members")
            }
            onPendingMembersClick={() =>
              navigate("/manage/member/registrations?tab=pending-members")
            }
          />
        </section>

        <section>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-950 sm:text-xl">Features</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enabled and disabled optional features for this club.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2.5 px-3 pb-3 pt-0 sm:gap-4 sm:px-6 sm:pb-6 md:grid-cols-2">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Enabled</h3>
                  <span className="text-xs text-slate-500">{enabledFeatures.length}</span>
                </div>
                <div className="space-y-2">
                  {enabledFeatures.length > 0 ? (
                    enabledFeatures.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-left text-sm text-emerald-900 transition-colors hover:border-emerald-200 hover:bg-emerald-100 sm:gap-3 sm:px-4 sm:py-3"
                        onClick={() => navigate(item.route)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 sm:px-4 sm:py-3">
                      No optional features are enabled.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Disabled</h3>
                  <span className="text-xs text-slate-500">{disabledFeatures.length}</span>
                </div>
                <div className="space-y-2">
                  {disabledFeatures.length > 0 ? (
                    disabledFeatures.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-left text-sm text-amber-900 transition-colors hover:border-amber-200 hover:bg-amber-100 sm:gap-3 sm:px-4 sm:py-3"
                        onClick={() => navigate(item.route)}
                      >
                        <XCircle className="h-3.5 w-3.5 text-amber-600 sm:h-4 sm:w-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 sm:px-4 sm:py-3">
                      No optional features are disabled.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-2.5 sm:space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">Quick navigation</h2>
            <p className="hidden text-sm text-slate-600 sm:block">Jump to any section of the admin portal.</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {portalSections.map((section) => (
              <Card key={section.title} className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="px-3 pb-2 pt-3 sm:px-6 sm:pt-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:h-9 sm:w-9">
                      <section.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-[13px] font-semibold text-slate-950 sm:text-base">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="mt-0.5 hidden text-xs text-slate-600 sm:block sm:text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 px-3 pb-3 pt-0 sm:space-y-2 sm:px-6 sm:pb-6">
                  {section.items.map((item) => (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 sm:px-4 sm:py-3"
                    >
                      <span className="font-medium">{item.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
