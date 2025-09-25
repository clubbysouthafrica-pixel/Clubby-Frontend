import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    Loader2,
    Star,
    Users
} from "lucide-react";
import { motion } from "framer-motion";
import {useContext} from "react";
import {Link, useNavigate} from "react-router-dom";
import { useFetchMemberClubsQuery } from "@/queries/member-club";
import { Club } from "@/interfaces/club";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function UserLandingPage() {
    const { isAdmin } = useContext(AuthContext) as AuthContextType;
    const navigate = useNavigate()
    const { data: myClubData, isLoading: clubsLoading } = useFetchMemberClubsQuery(isAdmin)

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Welcome Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="shadow-none rounded border-none">
                            <CardContent className="pt-6">
                                <h1 className="text-2xl font-bold mb-2">
                                    Welcome back!
                                </h1>
                                <p className="text-muted-foreground">
                                    Your club activities at a glance
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Clubs Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="shadow-none rounded">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Your Clubs</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => navigate("/myclubs")}>
                                    View All <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {clubsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {myClubData?.items?.map((club: Club) => (
                                            <div
                                                key={club.club_account_id}
                                                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                                                onClick={() => navigate(`/clubs/${club.club_account_id}`)}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Users className="h-8 w-8 text-primary" />
                                                    <div>
                                                        <h3 className="font-medium">{club.club_name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {club.club_type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge className={club.resubmission_required ? "bg-red-700" : club.registered ? "bg-green-700" : "bg-yellow-700"}>{club.resubmission_required ? "Resumission required" : club.registered ? "Member" : "Pending"}</Badge>
                                                </div>
                                            </div>
                                        ))}

                                        {!myClubData?.items?.length &&
                                            <div>
                                                Browse clubs <Link to="/clubs" className="underline">Here</Link>
                                            </div>
                                        }
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Events Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 border-l border-muted pl-6 sticky top-0">
                    {/* Featured Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="shadow-none rounded">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Star className="mr-2 h-4 w-4" /> Featured
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="font-medium">📢 New Feature Alert!</p>
                                    <p className="text-sm text-muted-foreground">
                                        Club event scheduling is now available! Try it out and organize your next meetup.
                                    </p>
                                    <Button className="w-full mt-2">Learn More</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}