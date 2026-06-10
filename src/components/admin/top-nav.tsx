import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"
import logoImg from "@/assets/logo.png"
import { fetchClub } from "@/services/admin/club"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Club, ClubContext, ClubContextType } from "@/context/ClubContext"
import { useFetchAdminClubs } from "@/queries/admin/clubs"

export function AdminTopNav() {
  const { club, setClub } = React.useContext(ClubContext) as ClubContextType
  const { data: clubData } = useFetchAdminClubs()

  const clubs = clubData?.data?.items as Club[] | undefined

  const handleClubSwitch = async (selected: Club) => {
    localStorage.removeItem("activeClub")
    try {
      const fullClubData = await fetchClub(selected.club_account_id)
      setClub({ ...selected, ...fullClubData })
    } catch {
      setClub(selected)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-[100px] items-center border-b-2 border-slate-300 bg-sidebar px-6 gap-3">
      <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900 md:hidden" />
      <Separator orientation="vertical" className="mx-1 h-6 md:hidden" />
      <img src={logoImg} alt="Logo" className="h-12 w-auto object-contain" />
      <span className="text-2xl font-bold tracking-tight text-slate-900">
        {import.meta.env.VITE_BRAND_NAME ?? "Clubby"}
      </span>

      <div className="flex-1" />

      {/* Club switcher */}
      {club && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 rounded-md focus:outline-none">
              <div className="flex flex-col items-end leading-tight">
                <span className="max-w-[180px] truncate font-semibold text-slate-800">
                  {club.club_name}
                </span>
                {club.club_type && (
                  <span className="text-xs font-normal text-slate-400">{club.club_type}</span>
                )}
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-52 rounded-lg" align="end" sideOffset={8}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Club</DropdownMenuLabel>
            {clubs?.map((c) => (
              <DropdownMenuItem
                key={c.club_account_id}
                onClick={() => handleClubSwitch(c)}
                className="gap-2 p-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border">
                  <GalleryVerticalEnd className="h-3.5 w-3.5 shrink-0" />
                </div>
                <span className="truncate">{c.club_name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
