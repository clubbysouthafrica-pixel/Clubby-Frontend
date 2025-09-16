import * as React from "react"
import {
  AudioWaveform,
  CircleAlertIcon,
  Command,
  GalleryVerticalEnd,
  HeadsetIcon,
  HomeIcon,
  HouseIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {ClubSwitcher} from "@/components/club-switcher.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useFetchAdminClubs } from "@/queries/admin/clubs"
import { ClubContext, ClubContextType } from "@/context/ClubContext"
// import { useNavigate } from "react-router-dom";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  clubs: [
    {
      name: "Rowing Club Seapoint",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Tennis Milnerton",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Rugby Club",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Club",
      url: "/manage/club",
      icon: HomeIcon,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "/"
        },
        {
          title: "Manage Club",
          url: "/manage/club",
        },
      ],
    },
    {
      title: "Members",
      url: "/manage/members",
      icon: UsersIcon,
      items: [
        {
          title: "Members",
          url: "/manage/members",
        },
        {
          title: "Registration Reports",
          url: "/manage/members/report",
        },
      ],
    },
    {
      title: "Registrations",
      url: "/manage/registrations",
      icon: UserPlusIcon,
      items: [
        {
          title: "Create Form",
          url: "/manage/registrations/forms",
        },
      ],
    },
  ],
  personal: [
    {
      name: "My Clubs",
      url: "/myclubs",
      icon: HouseIcon,
    },
    {
      name: "About",
      url: "/about",
      icon: CircleAlertIcon,
    },
    {
      name: "Contact Us",
      url: "/contactus",
      icon: HeadsetIcon,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const navigate = useNavigate();

  const {club} = React.useContext(ClubContext) as ClubContextType
  const { data: clubData, isLoading: loadingClubs } = useFetchAdminClubs()

  // if (clubData && clubData.status == 403) {
  //   navigate("/admin/login")
  //   // window.location.reload();
  // }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        { !loadingClubs &&
          <ClubSwitcher clubs={(clubData.data as any)?.items} />
        }
      </SidebarHeader>
      <SidebarContent>
        {
          club?.club_account_id &&
          <NavMain items={data.navMain} />
        }
        {/* <NavProjects projects={data.personal} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
