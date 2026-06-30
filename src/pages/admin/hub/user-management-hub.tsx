import { SectionHub } from "@/components/admin/section-hub"
import { Users } from "lucide-react"

export default function UserManagementHubPage() {
  return (
    <SectionHub
      title="User Management"
      description="View and manage all users that have interacted with your system."
      items={[
        {
          title: "Users",
          description: "View and manage all current users of your club.",
          url: "/manage/members",
          icon: Users,
        },
      ]}
    />
  )
}
