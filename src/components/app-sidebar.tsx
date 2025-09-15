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
        // {
        //   title: "Edit",
        //   url: "/manage/club/edit",
        // },
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
        // {
        //   title: "Balances",
        //   url: "/manage/members/balances",
        // },
        // {
        //   title: "Audit Trails",
        //   url: "/manage/members/audit-trails",
        // },
      ],
    },
    // {
    //   title: "Mail Drops",
    //   url: "/manage/mail-drops",
    //   icon: MailsIcon,
    //   items: [
    //     {
    //       title: "Types",
    //       url: "/manage/mail-drops/types",
    //     },
    //     {
    //       title: "Initialize",
    //       url: "/manage/mail-drops/initialize",
    //     },
    //     {
    //       title: "Audit",
    //       url: "/manage/mail-drops/audit",
    //     },
    //   ],
    // },
    {
      title: "Registrations",
      url: "/manage/registrations",
      icon: UserPlusIcon,
      items: [
        // {
        //   title: "List",
        //   url: "/manage/registrations",
        // },
        // {
        //   title: "Financial Reports",
        //   url: "/manage/registrations/financial-reports",
        // },
        {
          title: "Create Form",
          url: "/manage/registrations/forms",
        },
      ],
    },
    // {
    //   title: "Storage",
    //   url: "/manage/storage",
    //   icon: BoxIcon,
    //   items: [
    //     {
    //       title: "Storage Groups",
    //       url: "/manage/storage/groups",
    //     },
    //     {
    //       title: "Diagram",
    //       url: "/manage/storage/diagram",
    //     },
    //     {
    //       title: "Pending",
    //       url: "/manage/storage/pending",
    //     },
    //     {
    //       title: "Add",
    //       url: "/manage/storage/add",
    //     },
    //     {
    //       title: "Cancel",
    //       url: "/manage/storage/cancel",
    //     },
    //     {
    //       title: "Pending Adjustments",
    //       url: "/manage/storage/pending-adjustments",
    //     },
    //     {
    //       title: "Members",
    //       url: "/manage/storage/members",
    //     },
    //     {
    //       title: "Release last season Storage",
    //       url: "/manage/storage/last-season-release",
    //     },
    //     {
    //       title: "Financial Reports (YTD)",
    //       url: "/manage/storage/reports",
    //     },
    //   ],
    // },
    // {
    //   title: "Extras",
    //   url: "/manage/extras",
    //   icon: SquarePlusIcon,
    //   items: [
    //     {
    //       title: "Pending",
    //       url: "/manage/extras/pending",
    //     },
    //     {
    //       title: "Add",
    //       url: "/manage/extras/add",
    //     },
    //     {
    //       title: "Cancel",
    //       url: "/manage/extras/cancel",
    //     },
    //     {
    //       title: "Pending Adjustments",
    //       url: "/manage/extras/pending-adjustments",
    //     },
    //     {
    //       title: "Members",
    //       url: "/manage/extras/members",
    //     },
    //     {
    //       title: "Financial Reports (YTD)",
    //       url: "/manage/extras/reports",
    //     },
    //   ],
    // },
    // {
    //   title: "Fees",
    //   url: "/manage/fees",
    //   icon: CircleDollarSignIcon,
    //   items: [
    //     {
    //       title: "Period Fee Category",
    //       url: "/manage/fees/period-fee-category",
    //     },
    //     {
    //       title: "Member Fee Category",
    //       url: "/manage/fees/member-fee-category",
    //     },
    //     {
    //       title: "Membership Type Fee Category",
    //       url: "/manage/fees/membership-type-fee-category",
    //     },
    //     {
    //       title: "Miscellaneous Fee Category",
    //       url: "/manage/fees/miscellaneous-fee-category",
    //     },
    //     {
    //       title: "Membership Fee List",
    //       url: "/manage/fees/membership-fee-list",
    //     },
    //     {
    //       title: "General Fee List",
    //       url: "/manage/fees/general-fee-list",
    //     },
    //     {
    //       title: "System Fee List",
    //       url: "/manage/fees/system-fee-list",
    //     },
    //     {
    //       title: "Pending Deposits",
    //       url: "/manage/fees/pending-deposits",
    //     },
    //     {
    //       title: "Update Fees",
    //       url: "/manage/fees/update-fees",
    //     },
    //     {
    //       title: "History",
    //       url: "/manage/fees/history",
    //     },
    //   ],
    // },
    // {
    //   title: "Accounts",
    //   url: "/manage/accounts",
    //   icon: CircleUserIcon,
    //   items: [
    //     {
    //       title: "Balances",
    //       url: "/manage/accounts/balances",
    //     },
    //     {
    //       title: "Out of Balance list",
    //       url: "/manage/balances/out-of-balance-list",
    //     },
    //     {
    //       title: "Adjustments",
    //       url: "/manage/balances/adjustments",
    //     },
    //   ],
    // },
    // {
    //   title: "Reports",
    //   url: "/manage/reports",
    //   icon: ChartColumnIcon,
    //   items: [
    //     {
    //       title: "Full Financial Reports (YTD)",
    //       url: "/manage/reports/full-financial-reports",
    //     },
    //   ],
    // },
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
  const {club} = React.useContext(ClubContext) as ClubContextType
  const { data: clubData, isLoading: loadingClubs } = useFetchAdminClubs()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        { !loadingClubs &&
          <ClubSwitcher clubs={clubData?.items} />
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
