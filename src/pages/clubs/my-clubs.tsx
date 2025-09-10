import {ClubCard} from "@/components/club-card.tsx";
import Pager from "@/components/pager.tsx";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Club } from "@/interfaces/club";
import { useFetchMemberClubsQuery } from "@/queries/member-club";
import { Loader2 } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";


export default function MyClubsPage() {
    const {isAdmin} = useContext(AuthContext) as AuthContextType
    const { data, isLoading } = useFetchMemberClubsQuery(isAdmin)
    const navigate = useNavigate()

    console.log('my data', data)

    return (
            <Pager>
                <div className="bg-background p-4 lg:p-0">
                        <div className="w-full pb-6">
                            {
                                isLoading &&
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                            }
                            {/*<Sidebar playlists={playlists} className="hidden lg:block" />*/}
                            {
                                !isLoading &&

                            <div className="col-span-3 lg:col-span-4">
                            <div className="h-full">
                                <div className="mt-6 space-y-1">
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        My Clubs
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Your active club subscriptions.
                                    </p>
                                </div>
                                <div className="relative mt-4">

                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 gap-y-10 lg:col-span-4">
                                        {data?.items?.map((club: Club) => (
                                            <ClubCard
                                                onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                                currency={club.currency}
                                                key={club.club_name}
                                                club={club}
                                                className="cursor-pointer"
                                                aspectRatio="square"
                                                width={250}
                                                height={250}
                                                titleClass="text-lg font-semibold tracking-tight"
                                                descriptionClass="text-xs tracking-tight"
                                                showRegistrationStatus={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                            }
                        </div>
                    </div>
            </Pager>
    )
}