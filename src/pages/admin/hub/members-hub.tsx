import { SectionHub } from "@/components/admin/section-hub"
import { ClipboardList, UserPlus, FileText } from "lucide-react"

export default function MembersHubPage() {
  return (
    <SectionHub
      title="Registrations"
      description="Review registration requests, register new members, and manage registration forms."
      items={[
        {
          title: "Registrations",
          description: "Review and approve pending member registration requests.",
          url: "/manage/member/registrations",
          icon: ClipboardList,
        },
        {
          title: "Register a Member",
          description: "Manually register a new member directly to your club.",
          url: "/manage/members/add",
          icon: UserPlus,
        },
        {
          title: "Registration Form",
          description: "Create and manage the registration form for new members.",
          url: "/manage/registrations/forms",
          icon: FileText,
        },
      ]}
    />
  )
}
