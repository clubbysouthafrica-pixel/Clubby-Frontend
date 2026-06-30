import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, QrCode } from "lucide-react"
import { ClubContext, ClubContextType } from "@/context/ClubContext"
import MemberVerificationScannerDialog from "@/components/admin/user-management/features/member-verification-scanner-dialog"
import { cn } from "@/lib/utils"

const cards = [
  {
    title: "Users",
    description: "View and manage all current users of your club.",
    url: "/manage/members",
    icon: Users,
  },
]

export default function UserManagementHubPage() {
  const navigate = useNavigate()
  const { club } = useContext(ClubContext) as ClubContextType
  const [scannerOpen, setScannerOpen] = useState(false)

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">User Management</h1>
        <p className="mt-2 text-base leading-relaxed text-slate-500">
          View and manage all users that have interacted with your system.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.url}
            onClick={() => navigate(card.url)}
            className={cn(
              "group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200",
              "hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-primary">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">{card.description}</p>
            </div>
          </button>
        ))}

        {club && (
          <>
            <button
              onClick={() => setScannerOpen(true)}
              className={cn(
                "group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200",
                "hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-primary">
                  Scan Membership QR
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Verify member identity by scanning their membership QR code.
                </p>
              </div>
            </button>
            <MemberVerificationScannerDialog
              clubId={club.club_account_id}
              open={scannerOpen}
              onOpenChange={setScannerOpen}
            />
          </>
        )}
      </div>
    </div>
  )
}
