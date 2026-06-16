import * as React from "react";
import {
  HomeIcon,
  LayoutDashboard,
  UserCog,
  ClipboardList,
  ShoppingBag,
  MapPin,
  CalendarDays,
  BoxIcon,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useFetchAdminClubs } from "@/queries/admin/clubs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { useGetProfileQuery } from "@/queries/profile";
import { useLocation } from "react-router-dom";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { club, setClub } = React.useContext(ClubContext) as ClubContextType;
  const { data: clubData } = useFetchAdminClubs();
  const syncedClubSummaryRef = React.useRef<string | null>(null);
  const { isAdmin } = React.useContext(AuthContext) as AuthContextType;
  const { data: profile } = useGetProfileQuery(isAdmin);
  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  });

  React.useEffect(() => {
    if (profile) {
      setUserData({
        name: `${profile?.first_name ?? ""} ${profile?.surfname ?? ""}`,
        email: profile.email ?? "",
        avatar: "/avatars/shadcn.jpg",
      });
    }
  }, [profile]);
  const isStageRestrictedClub =
    import.meta.env.VITE_ENVIRONMENT === "Stage" &&
    club?.club_account_id === "club_1779873109284_101715";

  // Auto-set the first club when clubs are loaded after login
  React.useEffect(() => {
    const adminClubs = clubData?.data?.items;

    if (!adminClubs || adminClubs.length === 0) {
      return;
    }

    if (!club) {
      setClub(adminClubs[0]);
      return;
    }

    const latestClub = adminClubs.find(
      (item: (typeof adminClubs)[number]) =>
        item.club_account_id === club.club_account_id,
    );

    if (!latestClub) {
      return;
    }

    const latestClubSummaryKey = [
      latestClub.club_account_id,
      latestClub.club_name,
      latestClub.club_type,
      latestClub.currency,
      latestClub.onboarded,
      latestClub.season_cycle,
      latestClub.deregistration_in_progress,
      latestClub.enable_shop,
      latestClub.enable_events,
      latestClub.enable_storage,
      latestClub.venues_enabled,
      latestClub.access,
    ].join("|");

    const shouldSyncClubSummary =
      club.club_name !== latestClub.club_name ||
      club.club_type !== latestClub.club_type ||
      club.currency !== latestClub.currency ||
      club.onboarded !== latestClub.onboarded ||
      club.season_cycle !== latestClub.season_cycle ||
      club.deregistration_in_progress !==
        latestClub.deregistration_in_progress ||
      club.enable_shop !== latestClub.enable_shop ||
      club.enable_events !== latestClub.enable_events ||
      club.enable_storage !== latestClub.enable_storage ||
      club.venues_enabled !== latestClub.venues_enabled ||
      club.access !== latestClub.access;

    if (
      shouldSyncClubSummary &&
      syncedClubSummaryRef.current !== latestClubSummaryKey
    ) {
      syncedClubSummaryRef.current = latestClubSummaryKey;
      setClub({
        ...club,
        ...latestClub,
      });
    }
  }, [clubData, club, setClub]);

  const location = useLocation();
  const pathname = location.pathname;

  const navItems = React.useMemo(() => {
    const baseItems = [
      {
        title: "Dashboard",
        url: "/",
        hubUrl: "/",
        icon: LayoutDashboard,
        items: [],
      },
      {
        title: "Club",
        url: "/manage/club",
        hubUrl: "/club-hub",
        icon: HomeIcon,
        items: [
          { title: "Manage Club", url: "/manage/club" },
          { title: "Club financials", url: "/reporting/general" },
        ],
      },
      {
        title: "User Management",
        url: "/user-management-hub",
        hubUrl: "/user-management-hub",
        icon: UserCog,
        items: [
          { title: "Members", url: "/manage/members" },
        ],
      },
      {
        title: "Registrations",
        url: "/members-hub",
        hubUrl: "/members-hub",
        icon: ClipboardList,
        items: [
          { title: "Registrations", url: "/manage/member/registrations" },
          { title: "Register a Member", url: "/manage/members/add" },
          { title: "Bulk Register Members", url: "/manage/members/add-bulk" },
          { title: "Registration Form", url: "/manage/registrations/forms" },
        ],
      },
      {
        title: "Shop",
        url: "/shop",
        hubUrl: "/shop-hub",
        icon: ShoppingBag,
        items: [
          { title: "Products", url: "/shop/products" },
          { title: "Orders", url: "/shop/orders" },
        ],
      },
      {
        title: "Booking",
        url: "/venues",
        hubUrl: "/venues",
        icon: MapPin,
        items: [
          { title: "Booking", url: "/venues" },
        ],
      },
      {
        title: "Events",
        url: "/events",
        hubUrl: "/events-hub",
        icon: CalendarDays,
        items: [
          { title: "Events", url: "/events" },
          { title: "Registrations", url: "/events/registrations" },
        ],
      },
    ];

    if (isStorageFeatureEnabled) {
      baseItems.splice(5, 0, {
        title: "Storage",
        url: "/storage",
        hubUrl: "/storage-hub",
        icon: BoxIcon,
        items: [
          { title: "Storage", url: "/storage" },
          { title: "Storage requests", url: "/storage/requests" },
        ],
      });
    }

    const visibleItems = isStageRestrictedClub
      ? baseItems
          .filter(
            (item) =>
              item.title === "Club" ||
              item.title === "Registrations",
          )
          .map((item) => {
            if (item.title === "Club") {
              return {
                ...item,
                items: item.items.filter(
                  (subItem) =>
                    subItem.title === "Club financials",
                ),
              };
            }
            return item;
          })
      : baseItems;

    const matchesUrl = (url: string | undefined) => {
      if (!url) return false;
      // root path must match exactly — otherwise startsWith("/") will match everything
      if (url === "/") return pathname === url;
      return pathname === url || pathname.startsWith(url);
    };

    return visibleItems.map((item) => {
      const matched =
        matchesUrl((item as { hubUrl?: string }).hubUrl) ||
        matchesUrl(item.url) ||
        item.items?.some((s) => pathname === s.url);

      return {
        ...item,
        isActive: Boolean(matched),
      };
    });
  }, [isStageRestrictedClub, pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-2 border-slate-300"
      style={{ "--sidebar-width": "230px" } as React.CSSProperties}
      {...props}
    >
      {/* Spacer to offset content below the fixed top nav */}
      <div className="h-[100px] shrink-0" />
      <SidebarContent className="gap-0">
        {club?.club_account_id && <NavMain items={navItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
