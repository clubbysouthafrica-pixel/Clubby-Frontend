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
import { HomeSectionCards } from "@/components/admin/club/home/section-cards";
import {
  ArrowRight,
  BoxIcon,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Settings,
  ShoppingBag,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useFetchAdminClubs, useFetchClub } from "@/queries/admin/clubs";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";
import DeregisterSeasonDialog from "@/components/admin/members/registrations/features/deregister-season";

export default function HomeDashboardPage() {
  const {
    club,
    setClub,
    isLoading: clubLoading,
  } = useContext(ClubContext) as ClubContextType;
  const clubAccountId = club?.club_account_id ?? "";
  const { data: adminClubsResponse } = useFetchAdminClubs();
  const { data: fetchedClub, isLoading: fetchedClubLoading } =
    useFetchClub(clubAccountId, { stats: true });
  const adminClubItems = adminClubsResponse?.data?.items ?? [];
  const activeAdminClub = adminClubItems.find(
    (item: { club_account_id?: string }) => item.club_account_id === clubAccountId,
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

  const featureStatus = useMemo(
    () => [
      {
        label: "Shop",
        enabled: Boolean(currentClub?.enable_shop),
        route: "/shop/products",
      },
      {
        label: "Events",
        enabled: Boolean(currentClub?.enable_events),
        route: "/events",
      },
      {
        label: "Storage",
        enabled: Boolean(currentClub?.enable_storage),
        route: "/storage",
      },
      {
        label: "Venues & bookings",
        enabled: Boolean(currentClub?.venues_enabled),
        route: "/venues",
      },
    ],
    [currentClub],
  );

  const portalSections = useMemo(
    () => [
      {
        title: "Club",
        description: "Manage club details, settings and financial overview.",
        icon: Settings,
        items: [
          { title: "Home", route: "/" },
          { title: "Manage Club", route: "/manage/club" },
          { title: "Club financials", route: "/reporting/general" },
        ],
      },
      {
        title: "Members",
        description: "Review members, registrations and add new members.",
        icon: Users,
        items: [
          { title: "Members", route: "/manage/members" },
          { title: "Registrations", route: "/manage/member/registrations" },
          { title: "Add member", route: "/manage/members/add" },
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
        title: "Venues & Bookings",
        description: "Configure venues and manage booking activity.",
        icon: MapPin,
        items: [
          { title: "Venues", route: "/venues" },
          { title: "Bookings", route: "/venues/bookings" },
        ],
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
        title: "Storage & Requests",
        description: "Manage storage units and review storage requests.",
        icon: BoxIcon,
        items: [
          { title: "Storage", route: "/storage" },
          { title: "Storage requests", route: "/storage/requests" },
        ],
      },
      {
        title: "Registration Form",
        description: "Build and maintain the club registration form.",
        icon: UserPlus,
        items: [
          { title: "Create Form", route: "/manage/registrations/forms" },
        ],
      }
    ].filter(
      (section) =>
        section.title !== "Storage & Requests" ||
        (isStorageFeatureEnabled && Boolean(currentClub?.enable_storage)),
    ),
    [currentClub],
  );

  const enabledFeatures = featureStatus.filter((item) => item.enabled);
  const disabledFeatures = featureStatus.filter((item) => !item.enabled);

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
        <div className="w-full px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {currentClub?.club_name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Season: <span className="font-medium text-slate-900">{currentClub?.season_cycle ?? "-"}</span></span>
                  <span>Type: <span className="font-medium text-slate-900">{currentClub?.club_type}</span></span>
                  <span>Currency: <span className="font-medium text-slate-900">{currentClub?.currency}</span></span>
                  <span>Access: <span className="font-medium text-slate-900">{currentClub?.access}</span></span>
                </div>
            </div>
            <div className="flex shrink-0 items-center">
              <DeregisterSeasonDialog clubId={currentClub?.club_account_id ?? ""} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-6 py-6">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Membership</h2>
            <p className="text-sm text-slate-600">Current season totals from the club summary.</p>
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
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-950">
                  Features
                </CardTitle>
                <CardDescription>
                  Enabled and disabled admin features for this club.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
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
                        className="flex w-full items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-900 transition-colors hover:border-emerald-200 hover:bg-emerald-100"
                        onClick={() => navigate(item.route)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No optional features are enabled.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
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
                        className="flex w-full items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 transition-colors hover:border-amber-200 hover:bg-amber-100"
                        onClick={() => navigate(item.route)}
                      >
                        <XCircle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      No optional features are disabled.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-950">Portal navigation</h2>
              <p className="text-sm text-slate-600">These links mirror the sections in the sidebar.</p>
            </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {portalSections.map((section) => (
                <Card
                  key={section.title}
                  className="border border-slate-200 bg-white shadow-sm"
                >
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-slate-950">
                          {section.title}
                        </CardTitle>
                      <CardDescription className="mt-0.5 text-sm text-slate-600">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                <CardContent className="space-y-1.5">
                    {section.items.map((item) => (
                    <button
                        key={item.route}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                        onClick={() => navigate(item.route)}
                      >
                        <span>{item.title}</span>
                        <ArrowRight className="h-4 w-4" />
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
