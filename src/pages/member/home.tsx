import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    Users,
    TrendingUp,
    Plus,
    Star
} from "lucide-react";
import { motion } from "framer-motion";
import {useContext} from "react";
import {useNavigate} from "react-router-dom";
import { useFetchMemberClubsQuery } from "@/queries/member-club";
import { Club } from "@/interfaces/club";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function UserLandingPage() {
    const { isAdmin } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate()
    const { data: myClubData, isLoading: clubsLoading } = useFetchMemberClubsQuery(isAdmin)

    // Animation variants for staggered animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4 md:space-y-6"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent sm:text-3xl md:text-4xl">
                            Welcome back!
                        </h1>
                        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg">
                            Manage your club memberships, track activities, and stay connected with your community
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div variants={itemVariants} className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
                            <CardContent className="p-3.5 sm:p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-500/20 p-2">
                                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400 sm:text-xs">Total Clubs</p>
                                        <div className="mt-1 flex items-baseline justify-between gap-3">
                                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 sm:text-2xl">
                                            {myClubData?.items?.length || 0}
                                            </p>
                                            <p className="text-[11px] text-right text-blue-600/70 dark:text-blue-400/70 sm:text-xs">
                                                Connected clubs
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20">
                            <CardContent className="p-3.5 sm:p-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-green-500/20 p-2">
                                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400 sm:text-xs">Active Memberships</p>
                                        <div className="mt-1 flex items-baseline justify-between gap-3">
                                            <p className="text-xl font-bold text-green-700 dark:text-green-300 sm:text-2xl">
                                            {myClubData?.items?.filter((club: Club) => club.registered).length || 0}
                                            </p>
                                            <p className="text-[11px] text-right text-green-600/70 dark:text-green-400/70 sm:text-xs">
                                                Approved members
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                        {/* Main Content */}
                        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
                            {/* Clubs Section */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="space-y-3 pb-3">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg sm:text-xl">Your Clubs</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    Manage your club memberships
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/clubs")}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Browse
                                                </Button>
                                                <Button variant="default" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/myclubs")}>
                                                    View All
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {clubsLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                </div>
                                                <p className="text-muted-foreground">Loading your clubs...</p>
                                            </div>
                                        ) : myClubData?.items?.length ? (
                                            <div className="space-y-2.5">
                                                {myClubData.items.slice(0, 3).map((club: Club, index: number) => (
                                                    <motion.div
                                                        key={club.club_account_id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group cursor-pointer rounded-lg border border-border/50 bg-gradient-to-r from-background to-muted/10 p-3 transition-all duration-300 hover:border-primary/20 hover:shadow-md"
                                                        onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                                    >
                                                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex min-w-0 items-start gap-3 sm:items-center">
                                                                <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20 sm:p-2.5">
                                                                    <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                                                                </div>
                                                                <div className="min-w-0 space-y-1">
                                                                    <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary sm:text-base">
                                                                        {club.club_name}
                                                                    </h3>
                                                                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                                                                        {club.club_type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start justify-between gap-3 sm:items-center sm:justify-end">
                                                                <Badge 
                                                                    variant={club.resubmission_required ? "destructive" : club.registered ? "default" : "secondary"}
                                                                    className="max-w-full whitespace-normal px-2 py-1 text-center text-[11px] leading-tight sm:max-w-[12rem] sm:text-xs"
                                                                >
                                                                    {club.resubmission_required ? "Resubmission Required" : club.registered ? "Active Member" : "Pending"}
                                                                </Badge>
                                                                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary sm:mt-0" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 space-y-4">
                                                <div className="w-20 h-20 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
                                                    <Users className="w-10 h-10 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold">No clubs yet</h3>
                                                    <p className="text-muted-foreground">
                                                        Discover and join clubs that match your interests
                                                    </p>
                                                </div>
                                                <Button onClick={() => navigate("/clubs")} className="mt-4">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Browse Clubs
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
 
                        </div>

                        {/* Sidebar */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            {/* Quick Actions */}
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
                                        className="h-10 w-full justify-start sm:h-11"
                                        onClick={() => navigate("/clubs")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Join New Club
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="h-10 w-full justify-start sm:h-11"
                                        onClick={() => navigate("/settings")}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Update Profile
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Notifications */}
                            {/* <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <Bell className="w-5 h-5 mr-2" />
                                        Notifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-6 text-muted-foreground">
                                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No notifications</p>
                                    </div>
                                </CardContent>
                            </Card> */}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}