import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { useContext, useEffect } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { HomeSectionCards } from "@/components/admin/club/home/section-cards";
import { Loader2, Users, FileText, BarChart2, Settings } from "lucide-react";
import { useFetchClub } from "@/queries/admin/clubs";

const manageRoutes = [
  {
    name: "Club",
    description:
      "Edit your club page, update bank details, support email, and email templates.",
    route: "/manage/club",
    icon: Settings,
  },
  {
    name: "Members",
    description:
      "Register new members or manage all current and past club members.",
    route: "/manage/members",
    icon: Users,
  },
  {
    name: "Registration Form",
    description:
      "Create and manage your club's registration form. Changes update reporting automatically.",
    route: "/manage/registrations/forms",
    icon: FileText,
  },
  {
    name: "Reporting",
    description: "View financial and general reports for your club.",
    route: "/reporting/general",
    icon: BarChart2,
  },
];

export default function HomeDashboardPage() {
  const {
    club,
    setClub,
    isLoading: clubLoading,
  } = useContext(ClubContext) as ClubContextType;
  const clubAccountId = club?.club_account_id ?? "";
  const { data: fetchedClub, isLoading: fetchedClubLoading } = useFetchClub(
    clubAccountId,
  );
  const currentClub = fetchedClub ?? club;
  const { data: report, isLoading: reportLoading } = useGeneralReportingQuery(
    clubAccountId,
    currentClub?.season_cycle ,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (fetchedClub && club) {
      if (
        fetchedClub.season_cycle !== club.season_cycle ||
        JSON.stringify(fetchedClub) !== JSON.stringify(club)
      ) {
        setClub(fetchedClub);
      }
    }
  }, [fetchedClub, club, setClub]);

  const isInitialLoad =
    clubLoading ||
    !clubAccountId ||
    fetchedClubLoading ||
    reportLoading ||
    !currentClub ||
    !report;

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="p-6 shadow-none rounded-none bg-none border-b bg-white">
        <div>
          <div className="text-3xl font-bold flex items-center gap-2">
            {currentClub?.club_name}
            <span className="ml-2 text-base font-medium text-muted-foreground">
              (Season {currentClub?.season_cycle})
            </span>
          </div>
          <CardDescription>
            Welcome to your club dashboard. Manage your club, members, and
            reporting from here.
          </CardDescription>
        </div>
        <div>
          <div className="flex flex-wrap gap-4">
            {/* You can add more club stats here if desired */}
            <div>
              <span className="text-muted-foreground text-sm">Currency:</span>
              <span className="ml-2 font-semibold">{currentClub?.currency}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Reporting Section Cards */}
        <div>
          <HomeSectionCards report={report} currency={currentClub?.currency} />
        </div>

        {/* Management Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {manageRoutes.map((r) => (
              <Card
                key={r.name}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(r.route)}
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <r.icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{r.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {r.description}
                  </CardDescription>
                  <Button variant="outline" onClick={() => navigate(r.route)}>
                    Manage {r.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
