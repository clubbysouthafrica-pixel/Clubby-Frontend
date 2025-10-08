import { cn } from "@/lib/utils";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/components/ui/context-menu.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Club } from "@/interfaces/club";
import { Badge } from "./ui/badge";
import { formatAmount } from "@/data/currencies";

interface ClubCardProps extends React.HTMLAttributes<HTMLDivElement> {
    club: Club
    aspectRatio?: "portrait" | "square"
    width?: number
    height?: number
    titleClass?: string
    descriptionClass?: string
    showRegistrationStatus: boolean
    currency: string
}

export function ClubCard({
    currency,
    club,
    aspectRatio = "portrait",
    width,
    height,
    className,
    titleClass,
    descriptionClass,
    showRegistrationStatus,
    ...props
}: ClubCardProps) {
    // const loadingIcon = 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif';

    return (
        <div className={cn("space-y-3", className)} {...props}>
            {/* <ContextMenu>
                <ContextMenuTrigger> */}
                    <div className="overflow-hidden rounded-md transition-all hover:scale-105">
                        <Avatar className={cn(
                            "h-auto w-full object-cover bg-muted rounded-lg",
                            aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
                        )}>
                            <AvatarImage className="w-full h-full object-cover object-center max-h-52"
                                src={club?.club_cover_url}
                                alt={club.club_name}
                            />
                            <AvatarFallback className="h-36 p-2">
                                {club.club_name?.split(" ").map((i: string) => i[0])}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                {/* </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                </ContextMenuContent>
            </ContextMenu> */}
            <div className="flex mt-2 space-x-2">
                <div className="text-sm flex-1">
                    <h3 className={cn("font-medium leading-none text-base", titleClass)}>{club.club_name}</h3>
                    <p className={cn("text-xs text-muted-foreground", descriptionClass)}>{club.club_type}</p>
                </div>
                {
                    showRegistrationStatus ?
                        <div className="text-sm space-y-1">
                            <Badge className="block ml-auto">
                                {club.registered
                                    ? "Member" : showRegistrationStatus ? "Pending member" : undefined
                                }
                            </Badge>
                            {
                                (club.outstanding_amount) &&
                                <Badge className="block ml-auto" variant="outline">
                                    Amount due: {formatAmount(club.outstanding_amount, currency)}
                                </Badge>
                            }
                        </div>
                        : undefined
                }
            </div>
        </div>
    )
}