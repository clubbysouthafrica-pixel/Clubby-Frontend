import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"
import { fetchClub } from "@/services/admin/club"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Club, ClubContext, ClubContextType } from "@/context/ClubContext"

export function ClubSwitcher({
  clubs,
}: {
  clubs: Club[]
}) {
  const {club, setClub} = React.useContext(ClubContext) as ClubContextType

  const handleClubSwitch = async (selectedClub: Club) => {
    // Reset local storage when switching clubs
    localStorage.removeItem("activeClub");
    
    try {
      // Fetch the full club details to get all properties like country_exists, currency_exists, etc.
      const fullClubData = await fetchClub(selectedClub.club_account_id)
      
      // Merge with the selected club to preserve all fields
      const completeClubData = {
        ...selectedClub,
        ...fullClubData
      }
      
      // Set the club with complete data
      setClub(completeClubData);
      
    } catch (error) {
      // Fallback to the selected club if fetch fails
      setClub(selectedClub);
    }
  }

  if (!clubs?.length) return

  const { isMobile } = useSidebar()

  React.useEffect(() => {
    if (!club) {
      setClub(clubs[0])
    }
  })

  if (!club) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {/* <activeTeam.logo className="size-4" /> */}
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{club.club_name}</span>
                <span className="truncate text-xs">{club.club_type}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Clubs
            </DropdownMenuLabel>
            {clubs.map((team, _index) => (
              <DropdownMenuItem
                key={team.club_account_id}
                onClick={() => handleClubSwitch(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {/* <team.logo className="size-3.5 shrink-0" /> */}
                  <GalleryVerticalEnd className="size-3.5 shrink-0" />
                </div>
                {team.club_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
