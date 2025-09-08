
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Mail, MapPin, Link as LinkIcon } from "lucide-react";
import Pager from "@/components/pager";
import {useNavigate} from "react-router-dom";

export default function ProfilePage() {
    const navigate = useNavigate()
    return (
        <Pager>
            <div className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="relative">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 rounded-lg bg-muted/30 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1707343843598-39755549ac9a"
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        {/*<Button size="sm" className="absolute top-4 right-4">*/}
                        {/*    <Camera className="h-4 w-4 mr-2" />*/}
                        {/*    Change Cover*/}
                        {/*</Button>*/}
                    </div>

                    {/* Profile Info */}
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:space-x-6 px-4">
                        <Avatar className="w-32 h-32 border-4 border-background">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
                            <h1 className="text-2xl font-bold">John Doe</h1>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-4">
                            <Button variant="outline" onClick={() => navigate("/setting")}>Edit Profile</Button>
                            {/*<Button>*/}
                            {/*    <Users className="h-4 w-4 mr-2" />*/}
                            {/*    Follow*/}
                            {/*</Button>*/}
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="mt-8">
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <Separator className="my-6" />

                        <TabsContent value="about">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Bio Section */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Bio</CardTitle>
                                        <CardDescription>
                                            A passionate developer with expertise in React and TypeScript
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>john.doe@example.com</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>San Francisco, CA</span>
                                            </div>
                                            <div className="flex items-center">
                                                <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <a href="#" className="text-primary">github.com/johndoe</a>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>Joined March 2024</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Stats Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Followers</span>
                                                <span className="font-medium">1.2k</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Following</span>
                                                <span className="font-medium">427</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Projects</span>
                                                <span className="font-medium">32</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="posts">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Posts</CardTitle>
                                    <CardDescription>Your recent posts will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>

                        <TabsContent value="projects">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Projects</CardTitle>
                                    <CardDescription>Your projects will appear here.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                    <CardDescription>Manage your profile settings.</CardDescription>
                                </CardHeader>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Pager>
    );
}