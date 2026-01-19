import * as React from "react";
import { HomeIcon, UserPlusIcon, UsersIcon, BarChart, ShoppingBag } from "lucide-react";
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
  const { club } = React.useContext(ClubContext) as ClubContextType;
  const { data: clubData, isLoading: loadingClubs } = useFetchAdminClubs();

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
          { title: "Add member", url: "/manage/members/add" },
        ],
      },
      // Only show Shop in development environment
      ...(process.env.NODE_ENV === 'development' ? [{
        title: "Shop",
        url: "/shop",
        icon: ShoppingBag,
        items: [
          { title: "Products", url: "/shop/products" },
          { title: "Orders", url: "/shop/orders" },
          { title: "Analytics", url: "/shop/analytics" },
        ],
      }] : []),
      {
        title: "Registration form",
        url: "/manage/registrations",
        icon: UserPlusIcon,
        items: [
          { title: "Create Form", url: "/manage/registrations/forms" },
          // { title: "Add Policy", url: "/manage/registrations/policy" },
        ],
      },
      {
        title: "Reporting",
        url: "/reporting",
        icon: BarChart,
        items: [
          { title: "Club financials", url: "/reporting/general" },
          { title: "Registration fees", url: "/reporting/registration" },
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
  }, [pathname]);

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
