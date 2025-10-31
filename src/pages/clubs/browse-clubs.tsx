import { useMemo, useState } from "react";
import Pager from "@/components/pager.tsx";
import { Club } from "@/interfaces/club";
import { useFetchClubsQuery } from "@/queries/clubs";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";


export default function BrowseClubsPage() {
    const { data, isLoading } = useFetchClubsQuery()
    const navigate = useNavigate()
    const [query, setQuery] = useState("")

    const filtered = useMemo(() => {
        const items: Club[] = data?.items ?? []
        if (!query) return items
        const q = query.trim().toLowerCase()
        return items.filter((c: Club) => (c.club_name ?? "").toLowerCase().includes(q))
    }, [data, query])

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
                    {
                        !isLoading &&

                        <div className="col-span-3 lg:col-span-4">
                            <div className="h-full">
                                <div className="mt-6 space-y-1">
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        Browse Clubs
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Browse existing clubs in the area.
                                    </p>
                                </div>
                                <div className="relative mt-4">
                                    <div className="mb-4">
                                        <Input
                                            placeholder="Search clubs by name"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        {filtered.length === 0 && (
                                            <div className="text-sm text-muted-foreground">No clubs found.</div>
                                        )}

                                        {filtered.map((club: Club) => (
                                            <button
                                                key={club.club_account_id}
                                                onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                                className="w-full text-left rounded-md p-3 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition cursor-pointer"
                                            >
                                                <div className="text-lg font-medium">{club.club_name}</div>
                                                <div className="text-sm text-muted-foreground">{club.club_account_id}</div>
                                            </button>
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