import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MdOutlineFormatListBulleted } from 'react-icons/md';
import { FaUserPlus } from 'react-icons/fa';
import { HiOutlineMailOpen } from 'react-icons/hi';
import { FaRegMoneyBillAlt } from 'react-icons/fa';
import {
    Award,
    Clock,
    Users,
} from "lucide-react";
import Pager from "@/components/pager";

const values = [
    {
        icon: <MdOutlineFormatListBulleted className="w-6 h-6 text-primary" />,
        title: "Custom Registration Forms",
        description:
            "Easily build your own dynamic registration forms using our intuitive admin interface. Tailor fields to your club’s needs — from basic contact info to specific preferences or uploads.",
    },
    {
        icon: <FaUserPlus className="w-6 h-6 text-primary" />,
        title: "Member Sign-Ups Made Simple",
        description:
            "Let members register directly through your form. Manage sign-ups in real-time, track statuses, and keep your club database automatically updated — no spreadsheets required.",
    },
    {
        icon: <HiOutlineMailOpen className="w-6 h-6 text-primary" />,
        title: "Broadcast Emails",
        description:
            "Reach your members instantly. Send announcements, reminders, or updates with our built-in email tool. Target your entire list or filter by custom segments.",
    },
    {
        icon: <FaRegMoneyBillAlt className="w-6 h-6 text-primary" />,
        title: "Financial Reporting",
        description:
            "Track payments, dues, and other financial activities in one place. Get clear summaries that help you stay on top of club finances without the accounting headache.",
    },
];

const achievements = [
    {
        number: "10k",
        label: "Active Users",
        icon: <Users className="w-6 h-6" />,
    },
    {
        number: "10+",
        label: "Club",
        icon: <Award className="w-6 h-6" />,
    },
    {
        number: "24/7",
        label: "Support",
        icon: <Clock className="w-6 h-6" />,
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
                            Established in 2024, our mission is to simplify and enhance how clubs manage registration and communication. Our platform empowers organizations by streamlining form creation, financial reporting, and member engagement — all in one place. From registrations to emails, we bring together the tools and support needed to build stronger communities.
                        </p>
                    </motion.div>
                </div>

                {/* Values Section */}
                <div className="mb-24">
                    <h2 className="text-2xl font-bold text-center mb-12">Features</h2>
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

                <div className="max-w-3xl mx-auto text-center">
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                            <p className="text-muted-foreground">
                            To empower clubs and communities with simple, effective tools to manage registration, communication, and reporting — all in one place.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Pager>
    );
}