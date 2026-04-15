import * as React from "react";
import {
  HomeIcon,
  UserPlusIcon,
  UsersIcon,
  BarChart,
  ShoppingBag,
  MapPin,
  CalendarDays,
  BoxIcon,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { ClubSwitcher } from "@/components/club-switcher.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useFetchAdminClubs } from "@/queries/admin/clubs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { useGetProfileQuery } from "@/queries/profile";
import { useNavigate, useLocation } from "react-router-dom";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { club, setClub } = React.useContext(ClubContext) as ClubContextType;
  const { data: clubData, isLoading: loadingClubs } = useFetchAdminClubs();
  const syncedClubSummaryRef = React.useRef<string | null>(null);

  const { isAdmin } = React.useContext(AuthContext) as AuthContextType;
  const { data: profile } = useGetProfileQuery(isAdmin);

  const [userData, setUserData] = React.useState({
    name: "",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  });

  React.useEffect(() => {
    // if (club != null && !club.onboarded) {
    //   navigate("/onboard")
    // }

    if (profile) {
      setUserData({
        name: `${profile?.first_name ?? ""} ${profile?.surfname ?? ""}`,
        email: profile.email ?? "",
        avatar: "/avatars/shadcn.jpg",
      });
    }
  }, [profile, club, navigate]);

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
        title: "Club",
        url: "/manage/club",
        icon: HomeIcon,
        items: [
          { title: "Home", url: "/" },
          { title: "Manage Club", url: "/manage/club" },
        ],
      },
      {
        title: "Members",
        url: "/manage/members",
        icon: UsersIcon,
        items: [
          { title: "Members", url: "/manage/members" },
          { title: "Registrations", url: "/manage/member/registrations" },
          { title: "Add member", url: "/manage/members/add" },
        ],
      },
      {
        title: "Shop",
        url: "/shop",
        icon: ShoppingBag,
        items: [
          { title: "Products", url: "/shop/products" },
          { title: "Orders", url: "/shop/orders" },
        ],
      },
      {
        title: "Venues & Bookings",
        url: "/venues",
        icon: MapPin,
        items: [
          { title: "Venues", url: "/venues" },
          { title: "Bookings", url: "/venues/bookings" },
        ],
      },
      {
        title: "Events",
        url: "/events",
        icon: CalendarDays,
        items: [
          { title: "Events", url: "/events" },
          { title: "Registrations", url: "/events/registrations" },
        ],
      },
      {
        title: "Storage & Requests",
        url: "/venues",
        icon: BoxIcon,
        items: [
          { title: "Storage", url: "/storage" },
          { title: "Storage requests", url: "/storage/requests" },
        ],
      },
      {
        title: "Registration form",
        url: "/manage/registrations",
        icon: UserPlusIcon,
        items: [{ title: "Create Form", url: "/manage/registrations/forms" }],
      },
      {
        title: "Reporting",
        url: "/reporting",
        icon: BarChart,
        items: [
          { title: "Club financials", url: "/reporting/general" },
          { title: "Registration fees", url: "/reporting/registration" },
          { title: "Shop reports", url: "/reporting/shop" },
          { title: "Income & Payments", url: "/reporting/transactions" },
        ],
      },
    ];

    const matchesUrl = (url: string | undefined) => {
      if (!url) return false;
      // root path must match exactly — otherwise startsWith("/") will match everything
      if (url === "/") return pathname === url;
      return pathname === url || pathname.startsWith(url);
    };

    return baseItems.map((item) => {
      const matched =
        matchesUrl(item.url) || item.items?.some((s) => matchesUrl(s.url));

      return {
        ...item,
        isActive: Boolean(matched),
      };
    });
  }, [pathname, club]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {!loadingClubs && (
          <ClubSwitcher clubs={((clubData as any).data as any)?.items} />
        )}
      </SidebarHeader>
      <SidebarContent>
        {club?.club_account_id && <NavMain items={navItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
