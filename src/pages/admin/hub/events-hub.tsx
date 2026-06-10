import { SectionHub } from "@/components/admin/section-hub"
import { CalendarDays, ClipboardList } from "lucide-react"

export default function EventsHubPage() {
  return (
    <SectionHub
      title="Events"
      description="Create and manage events, track attendees, and handle event registrations."
      items={[
        {
          title: "Events",
          description: "Create, publish, and manage your club's events.",
          url: "/events",
          icon: CalendarDays,
        },
        {
          title: "Registrations",
          description: "View and manage attendee registrations for your events.",
          url: "/events/registrations",
          icon: ClipboardList,
        },
      ]}
    />
  )
}
