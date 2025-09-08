import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Award,
    Clock,
    Heart,
    Lightbulb,
    Target,
    Users,
} from "lucide-react";
import Pager from "@/components/pager";

const values = [
    {
        icon: <Heart className="w-6 h-6 text-primary" />,
        title: "Passion",
        description:
            "We're passionate about creating exceptional experiences and driving innovation in everything we do.",
    },
    {
        icon: <Users className="w-6 h-6 text-primary" />,
        title: "Community",
        description:
            "Building and nurturing a strong, inclusive community is at the heart of our mission.",
    },
    {
        icon: <Target className="w-6 h-6 text-primary" />,
        title: "Excellence",
        description:
            "We strive for excellence in every aspect of our work, setting high standards and exceeding expectations.",
    },
    {
        icon: <Lightbulb className="w-6 h-6 text-primary" />,
        title: "Innovation",
        description:
            "Constantly pushing boundaries and exploring new ideas to stay ahead in a rapidly evolving landscape.",
    },
];

const achievements = [
    {
        number: "500K+",
        label: "Active Users",
        icon: <Users className="w-6 h-6" />,
    },
    {
        number: "50+",
        label: "Countries",
        icon: <Award className="w-6 h-6" />,
    },
    {
        number: "24/7",
        label: "Support",
        icon: <Clock className="w-6 h-6" />,
    },
];

const team = [
    {
        name: "Alex Johnson",
        role: "CEO & Founder",
        image: "/team/alex.jpg",
        bio: "Visionary leader with 15+ years in tech",
    },
    {
        name: "Sarah Chen",
        role: "CTO",
        image: "/team/sarah.jpg",
        bio: "Engineering leader & cloud architecture expert",
    },
    {
        name: "Michael Ross",
        role: "Head of Design",
        image: "/team/michael.jpg",
        bio: "Award-winning designer & UX specialist",
    },
    {
        name: "Emma Wilson",
        role: "Head of Product",
        image: "/team/emma.jpg",
        bio: "Product strategist & innovation champion",
    },
];

export default function AboutPage() {
    return (
        <Pager>
            <div className="container mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold mb-4">Our Story</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Founded in 2024, we're on a mission to transform the way people connect
                            and collaborate in the digital age. Our platform brings together
                            technology and community to create meaningful experiences.
                        </p>
                    </motion.div>
                </div>

                {/* Values Section */}
                <div className="mb-24">
                    <h2 className="text-2xl font-bold text-center mb-12">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="mb-4">{value.icon}</div>
                                        <CardTitle>{value.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{value.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Achievements Section */}
                <div className="mb-24 bg-primary/5 rounded-3xl py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {achievements.map((achievement, index) => (
                            <motion.div
                                key={achievement.label}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="mb-4 flex justify-center">
                                    {achievement.icon}
                                </div>
                                <h3 className="text-4xl font-bold mb-2">{achievement.number}</h3>
                                <p className="text-muted-foreground">{achievement.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-24">
                    <h2 className="text-2xl font-bold text-center mb-12">Our Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, index) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="text-center">
                                    <CardContent className="pt-6">
                                        <Avatar className="w-24 h-24 mx-auto mb-4">
                                            <AvatarImage src={member.image} alt={member.name} />
                                            <AvatarFallback>
                                                {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                                        <p className="text-primary mb-2">{member.role}</p>
                                        <p className="text-muted-foreground text-sm">{member.bio}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mission Statement */}
                <div className="max-w-3xl mx-auto text-center">
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                            <p className="text-muted-foreground">
                                To empower individuals and organizations through innovative
                                technology solutions that foster collaboration, creativity, and
                                growth. We're committed to building a future where technology
                                brings people together and creates opportunities for everyone.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Pager>
    );
}