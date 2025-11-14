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
            <div className="container mx-auto px-4 py-12">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Welcome back!
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Manage your club memberships, track activities, and stay connected with your community
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Clubs</p>
                                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                                            {myClubData?.items?.length || 0}
                                        </p>
                                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                                            Clubs you're connected to
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-500/20 rounded-2xl">
                                        <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">Active Memberships</p>
                                        <p className="text-4xl font-bold text-green-700 dark:text-green-300">
                                            {myClubData?.items?.filter((club: Club) => club.registered).length || 0}
                                        </p>
                                        <p className="text-xs text-green-600/70 dark:text-green-400/70">
                                            Approved memberships
                                        </p>
                                    </div>
                                    <div className="p-4 bg-green-500/20 rounded-2xl">
                                        <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Clubs Section */}
                            <motion.div variants={itemVariants}>
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-2xl">Your Clubs</CardTitle>
                                                <p className="text-muted-foreground">
                                                    Manage your club memberships
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => navigate("/clubs")}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Browse
                                                </Button>
                                                <Button variant="default" size="sm" onClick={() => navigate("/myclubs")}>
                                                    View All
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {clubsLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                </div>
                                                <p className="text-muted-foreground">Loading your clubs...</p>
                                            </div>
                                        ) : myClubData?.items?.length ? (
                                            <div className="space-y-3">
                                                {myClubData.items.slice(0, 3).map((club: Club, index: number) => (
                                                    <motion.div
                                                        key={club.club_account_id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer bg-gradient-to-r from-background to-muted/10"
                                                        onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                                                    <Users className="w-6 h-6 text-primary" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                                        {club.club_name}
                                                                    </h3>
                                                                    <p className="text-sm text-muted-foreground font-medium">
                                                                        {club.club_type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <Badge 
                                                                    variant={club.resubmission_required ? "destructive" : club.registered ? "default" : "secondary"}
                                                                    className="font-medium"
                                                                >
                                                                    {club.resubmission_required ? "Resubmission Required" : club.registered ? "Active Member" : "Pending"}
                                                                </Badge>
                                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <Star className="w-5 h-5 mr-2" />
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start h-12"
                                        onClick={() => navigate("/clubs")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Join New Club
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start h-12"
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