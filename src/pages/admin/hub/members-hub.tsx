import { useContext } from "react"
import { SectionHub } from "@/components/admin/section-hub"
import { RegistrationSettingsDialog } from "@/components/admin/registrations/registration-settings-dialog"
import { ClubContext, ClubContextType } from "@/context/ClubContext"
import { ClipboardList, UserPlus, FileText, Users, BarChart2 } from "lucide-react"

export default function MembersHubPage() {
  const { club } = useContext(ClubContext) as ClubContextType

  return (
    <SectionHub
      title="Registrations"
      description="Review registration requests, register new members, and manage registration forms."
      headerAction={
        club?.club_account_id ? (
          <RegistrationSettingsDialog clubAccountId={club.club_account_id} />
        ) : null
      }
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
          title: "Bulk Register Members",
          description: "Register multiple members at once using a shared registration form.",
          url: "/manage/members/add-bulk",
          icon: Users,
        },
        {
          title: "Registration Form",
          description: "Create and manage the registration form for new members.",
          url: "/manage/registrations/forms",
          icon: FileText,
        },
        {
          title: "Registration Reporting",
          description: "Review registration revenue trends, pending balances, and field-level billing performance.",
          url: "/manage/member/registrations/reporting",
          icon: BarChart2,
        },
      ]}
    />
  )
}
