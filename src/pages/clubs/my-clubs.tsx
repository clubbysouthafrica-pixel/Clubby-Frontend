import Pager from "@/components/pager.tsx";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Club } from "@/interfaces/club";
import { useFetchMemberClubsQuery } from "@/queries/member-club";
import {
  Loader2,
  Search,
  Users,
  MapPin,
  Calendar,
  Star,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  Crown,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MyClubsPage() {
  const { isAdmin } = useContext(AuthContext) as AuthContextType;
  const { data, isLoading } = useFetchMemberClubsQuery(isAdmin);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const items: Club[] = data?.items ?? [];
    if (!query) return items;
    const q = query.trim().toLowerCase();
    return items.filter((c: Club) =>
      (c.club_name ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <Pager>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in-50 duration-300">
              <Crown className="w-4 h-4 mr-2" />
              Your Communities
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-700">
              My
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Club Memberships
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              Manage your club memberships and stay connected with your
              communities. Track your registration status and access club
              resources.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search your clubs by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 border-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-12 px-4 border-primary/20 hover:bg-primary/5"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div className="flex border border-primary/20 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-12 px-3 rounded-none border-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-12 px-3 rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Loading your club memberships...
            </p>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "No clubs found"
                : `You have ${filtered.length} club membership${filtered.length === 1 ? "" : "s"}`}
              {query && ` matching "${query}"`}
            </p>
          </div>
        )}

        {/* Club Grid/List */}
        {!isLoading && (
          <div
            className={cn(
              "gap-6",
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col space-y-4",
            )}
          >
            {filtered.length === 0 && !query && (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No club memberships</h3>
                  <p className="text-muted-foreground">
                    You haven't joined any clubs yet. Browse clubs to find
                    communities that match your interests!
                  </p>
                  <Button onClick={() => navigate("/clubs")}>
                    Browse Clubs
                  </Button>
                </div>
              </div>
            )}

            {filtered.length === 0 && query && (
              <div className="col-span-full text-center py-16">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No clubs found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or browse all your clubs.
                  </p>
                  <Button variant="outline" onClick={() => setQuery("")}>
                    Clear Search
                  </Button>
                </div>
              </div>
            )}

            {filtered.map((club: Club) => {
              const getStatusInfo = () => {
                if (club?.resubmission_required) {
                  return {
                    label: "Resubmission Required",
                    icon: AlertCircle,
                    variant: "destructive" as const,
                    color: "text-destructive",
                  };
                } else if (club?.registered) {
                  return {
                    label: "Active Member",
                    icon: CheckCircle,
                    variant: "default" as const,
                    color: "text-green-600",
                  };
                } else {
                  return {
                    label: "Pending Member",
                    icon: Clock,
                    variant: "secondary" as const,
                    color: "text-yellow-600",
                  };
                }
              };

              const statusInfo = getStatusInfo();
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={club.club_account_id}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-primary/20 hover:border-primary/40",
                    viewMode === "list" && "flex-row",
                  )}
                  onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                >
                  <CardContent
                    className={cn(
                      "p-6",
                      viewMode === "list"
                        ? "flex items-center space-x-4"
                        : "space-y-4",
                    )}
                  >
                    {/* Club Avatar/Logo Placeholder */}
                    <div
                      className={cn(
                        "rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                        viewMode === "list"
                          ? "w-12 h-12 flex-shrink-0"
                          : "w-16 h-16 mx-auto",
                      )}
                    >
                      <Users
                        className={cn(
                          "text-primary",
                          viewMode === "list" ? "w-6 h-6" : "w-8 h-8",
                        )}
                      />
                    </div>

                    {/* Club Info */}
                    <div
                      className={cn(
                        viewMode === "list" ? "flex-grow" : "text-center",
                      )}
                    >
                      <h3
                        className={cn(
                          "font-semibold text-foreground group-hover:text-primary transition-colors",
                          viewMode === "list" ? "text-lg" : "text-xl mb-2",
                        )}
                      >
                        {club.club_name || "Unnamed Club"}
                      </h3>

                      {/* Status Badge */}
                      <div
                        className={cn(
                          "flex items-center gap-2 mb-3",
                          viewMode === "list" ? "" : "justify-center",
                        )}
                      >
                        <Badge
                          variant={statusInfo.variant}
                          className="flex items-center gap-1"
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {viewMode === "grid" && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            Community Member
                          </div>
                          <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            Active Membership
                          </div>
                        </div>
                      )}

                      {viewMode === "list" && (
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            Member
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            Active
                          </div>
                        </div>
                      )}

                      {/* Club ID Badge */}
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          viewMode === "list" ? "mt-1" : "justify-center",
                        )}
                      >
                        <Badge variant="secondary" className="text-xs">
                          ID: {club.club_account_id}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div
                      className={cn(
                        "flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors",
                        viewMode === "list" ? "flex-shrink-0" : "mt-2",
                      )}
                    >
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Pager>
  );
}
