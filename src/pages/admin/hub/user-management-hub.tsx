import { SectionHub } from "@/components/admin/section-hub"
import { Users } from "lucide-react"

export default function UserManagementHubPage() {
  return (
    <SectionHub
      title="User Management"
      description="View and manage your club's members."
      items={[
        {
          title: "Members",
          description: "View and manage all current members of your club.",
          url: "/manage/members",
          icon: Users,
        },
      ]}
    />
  )
}
