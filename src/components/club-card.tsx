import { cn } from "@/lib/utils"

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Club } from "@/interfaces/club";
import { Badge } from "./ui/badge";

interface ClubCardProps extends React.HTMLAttributes<HTMLDivElement> {
    club: Club
    aspectRatio?: "portrait" | "square"
    width?: number
    height?: number
    titleClass?: string
    descriptionClass?: string
}

export function ClubCard({
                                 club,
                                 aspectRatio = "portrait",
                                 width,
                                 height,
                                 className,
                                 titleClass,
                             descriptionClass,
                                 ...props
                             }: ClubCardProps) {
    return (
        <div className={cn("space-y-3", className)} {...props}>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div className="overflow-hidden rounded-md transition-all hover:scale-105">
                        <Avatar className={cn(
                            "h-auto w-full object-cover bg-muted",
                            aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
                        )}>
                            <AvatarImage className="w-full h-full object-cover object-center max-h-52" src={club.club_cover_url} alt={club.club_name} />
                            <AvatarFallback>
                                <img className="w-full h-full object-cover object-center" src="https://images.unsplash.com/photo-1707343843598-39755549ac9a" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                    {/* <ContextMenuItem>Add to Library</ContextMenuItem>
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>Add to Playlist</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                            <ContextMenuItem>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Playlist
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            {playlists.map((playlist) => (
                                <ContextMenuItem key={playlist}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3" />
                                    </svg>
                                    {playlist}
                                </ContextMenuItem>
                            ))}
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator /> */}
                    <ContextMenuItem>View Club</ContextMenuItem>
                    {/* <ContextMenuItem>Play Later</ContextMenuItem>
                    <ContextMenuItem>Create Station</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>Like</ContextMenuItem>
                    <ContextMenuItem>Share</ContextMenuItem> */}
                </ContextMenuContent>
            </ContextMenu>
            <div className="flex mt-2 space-x-2">
                {/* <Avatar>
                    <AvatarImage className="w-12 h-12 object-cover object-center rounded-lg" src={club.club_profile_url} alt={club.club_name} />
                    <AvatarFallback>
                        <img className="w-12 h-12 object-cover object-center rounded-lg" src="https://images.unsplash.com/photo-1707343843598-39755549ac9a" />
                    </AvatarFallback>
                </Avatar> */}

                <div className="text-sm flex-1">
                    <h3 className={cn("font-medium leading-none text-base", titleClass)}>{club.club_name}</h3>
                    <p className={cn("text-xs text-muted-foreground", descriptionClass)}>{club.club_type}</p>
                </div>
                <div className="text-sm space-y-1">
                    <Badge className="block ml-auto">
                        {club.registered
                            ? "Member" : "Register"
                        }
                    </Badge>
                    {
                        (!!club.outstanding_amount) &&
                        <Badge className="block ml-auto" variant="outline">
                            Amount due: {(club.outstanding_amount / 100)}
                        </Badge>
                    }
                </div>
            </div>
        </div>
    )
}