import { SectionHub } from "@/components/admin/section-hub"
import { BoxIcon, InboxIcon } from "lucide-react"

export default function StorageHubPage() {
  return (
    <SectionHub
      title="Storage & Requests"
      description="Manage club storage items and review member storage requests."
      items={[
        {
          title: "Storage",
          description: "View and manage all storage items belonging to the club.",
          url: "/storage",
          icon: BoxIcon,
        },
        {
          title: "Storage Requests",
          description: "Review and action member requests for storage.",
          url: "/storage/requests",
          icon: InboxIcon,
        },
      ]}
    />
  )
}
