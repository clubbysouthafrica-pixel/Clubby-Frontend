import { SectionHub } from "@/components/admin/section-hub"
import { Settings, TrendingUp } from "lucide-react"

export default function ClubHubPage() {
  return (
    <SectionHub
      title="Club"
      description="Manage your club's profile, settings, and track financial performance."
      items={[
        {
          title: "Manage Club",
          description: "Update your club's profile, settings, and configuration.",
          url: "/manage/club",
          icon: Settings,
        },
        {
          title: "Club Financials",
          description: "View financial reports and track club revenue.",
          url: "/reporting/general",
          icon: TrendingUp,
        },
      ]}
    />
  )
}
