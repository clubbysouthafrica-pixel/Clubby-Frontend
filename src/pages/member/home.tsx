import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    Users,
    TrendingUp,
    Plus,
    Star,
    ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import {useContext} from "react";
import {useNavigate} from "react-router-dom";
import { useFetchMemberClubsQuery } from "@/queries/member-club";
import { Club, NonRegistrationClub } from "@/interfaces/club";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function UserLandingPage() {
    const { isAdmin } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate()
    const { data: myClubData, isLoading: clubsLoading } = useFetchMemberClubsQuery(isAdmin)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-6 md:py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 md:space-y-6"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="space-y-0.5 text-center sm:space-y-2">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent sm:text-3xl md:text-4xl">
                            Welcome back!
                        </h1>
                        <p className="hidden sm:block mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg">
                            Manage your memberships, track activities, and stay connected with your community
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div variants={itemVariants} className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:gap-4 md:gap-5">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
                            <CardContent className="p-2.5 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="rounded-lg bg-blue-500/20 p-1.5 sm:p-2">
                                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400 sm:text-xs sm:tracking-[0.18em]">Total Clubs</p>
                                        <div className="mt-0.5 flex items-baseline justify-between gap-2 sm:mt-1 sm:gap-3">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300 sm:text-2xl">
                                                {myClubData?.items?.length || 0}
                                            </p>
                                            <p className="hidden text-[11px] text-right text-blue-600/70 dark:text-blue-400/70 sm:block sm:text-xs">
                                                Connected clubs
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20">
                            <CardContent className="p-2.5 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="rounded-lg bg-green-500/20 p-1.5 sm:p-2">
                                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-green-600 dark:text-green-400 sm:text-xs sm:tracking-[0.18em]">Active</p>
                                        <div className="mt-0.5 flex items-baseline justify-between gap-2 sm:mt-1 sm:gap-3">
                                            <p className="text-lg font-bold text-green-700 dark:text-green-300 sm:text-2xl">
                                                {myClubData?.items?.filter((club: Club) => club.registered).length || 0}
                                            </p>
                                            <p className="hidden text-[11px] text-right text-green-600/70 dark:text-green-400/70 sm:block sm:text-xs">
                                                Approved members
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-6">
                        {/* Main Content */}
                        <div className="space-y-3 lg:col-span-2 lg:space-y-6">
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="px-3 py-2.5 sm:px-6 sm:py-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-base sm:text-xl">My Activity</CardTitle>
                                                <p className="hidden text-sm text-muted-foreground sm:block">
                                                    Your activity at Clubby
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <Button variant="outline" size="sm" className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => navigate("/clubs")}>
                                                    <Plus className="h-3 w-3 sm:mr-1.5 sm:h-4 sm:w-4" />
                                                    <span className="hidden sm:inline">Browse</span>
                                                </Button>
                                                <Button variant="default" size="sm" className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => navigate("/myclubs")}>
                                                    <span className="hidden sm:inline">View All</span>
                                                    <span className="sm:hidden">All</span>
                                                    <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
                                        {clubsLoading ? (
                                            <div className="flex flex-col items-center justify-center py-6 space-y-3 sm:py-12 sm:space-y-4">
                                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin sm:w-12 sm:h-12" />
                                                <p className="text-sm text-muted-foreground">Loading your clubs...</p>
                                            </div>
                                        ) : (myClubData?.items?.length || myClubData?.non_registration_clubs?.length) ? (
                                            <div className="space-y-2">
                                                {myClubData.items?.slice(0, 3).map((club: Club, index: number) => (
                                                    <motion.div
                                                        key={club.club_account_id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group cursor-pointer rounded-lg border border-border/50 bg-gradient-to-r from-background to-muted/10 p-2.5 transition-all duration-300 hover:border-primary/20 hover:shadow-md sm:p-3"
                                                        onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <div className="rounded-lg bg-primary/10 p-1.5 transition-colors group-hover:bg-primary/20 sm:p-2.5">
                                                                    <Users className="h-3.5 w-3.5 text-primary sm:h-5 sm:w-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                                                                        {club.club_name}
                                                                    </h3>
                                                                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                                                                        {club.club_type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                <Badge
                                                                    variant={club.resubmission_required ? "destructive" : club.registered ? "default" : "secondary"}
                                                                    className="text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2 sm:py-1"
                                                                >
                                                                    {club.resubmission_required ? "Resubmission" : club.registered ? "Active" : "Pending"}
                                                                </Badge>
                                                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {myClubData?.non_registration_clubs?.map((club: NonRegistrationClub, index: number) => (
                                                    <motion.div
                                                        key={club.club_account_id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group cursor-pointer rounded-lg border border-border/50 bg-gradient-to-r from-background to-muted/10 p-2.5 transition-all duration-300 hover:border-primary/20 hover:shadow-md sm:p-3"
                                                        onClick={() => navigate(`/myclubs/${club.club_account_id}`)}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-2.5">
                                                                <div className="rounded-lg bg-amber-500/10 p-1.5 transition-colors group-hover:bg-amber-500/20 sm:p-2.5">
                                                                    <ShoppingBag className="h-3.5 w-3.5 text-amber-600 sm:h-5 sm:w-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                                                                        {club.club_name}
                                                                    </h3>
                                                                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                                                                        {club.currency}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 sm:text-xs sm:px-2 sm:py-1">
                                                                    Shop only
                                                                </Badge>
                                                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 space-y-3 sm:py-12 sm:space-y-4">
                                                <div className="w-12 h-12 mx-auto bg-muted/30 rounded-full flex items-center justify-center sm:w-20 sm:h-20">
                                                    <Users className="w-6 h-6 text-muted-foreground sm:w-10 sm:h-10" />
                                                </div>
                                                <div className="space-y-1 sm:space-y-2">
                                                    <h3 className="text-base font-semibold sm:text-lg">No activity yet</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Discover and join clubs that match your interests
                                                    </p>
                                                </div>
                                                <Button onClick={() => navigate("/clubs")} size="sm">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Browse Clubs
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Sidebar — hidden on mobile */}
                        <motion.div variants={itemVariants} className="hidden lg:block space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <Star className="w-5 h-5 mr-2" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2.5">
                                    <Button
                                        variant="outline"
                                        className="h-11 w-full justify-start"
                                        onClick={() => navigate("/clubs")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Join New Club
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 w-full justify-start"
                                        onClick={() => navigate("/settings")}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Update Profile
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
