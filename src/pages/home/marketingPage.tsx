import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { ArrowRight, FilePlus, Mail, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useNavigate } from "react-router-dom";

export const MarketingLandingPage = () => {
    const brandName = import.meta.env.VITE_BRAND_NAME;
    const navigate = useNavigate()

    return (
        <div>
            {/* Hero Section */}
            <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-6xl font-bold tracking-tight">
                        Welcome to <span className="text-primary">{brandName}</span>
                    </h1>
                    <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your all-in-one platform to manage, track, and engage with your sports clubs.
                    </p>
                    <div className="flex gap-4 mt-8 justify-center">
                        <Button size="lg" onClick={() => navigate('/getstarted')}>
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate('/about')}>
                            Learn More
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-muted/50">
                <div className="container px-4 mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Key Features
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="p-6">
                            <CardHeader>
                                <FilePlus className="h-12 w-12 text-primary mb-4" />
                                <CardTitle>Dynamic Form Builder</CardTitle>
                                <CardDescription>
                                    Create fully customizable registration forms with drag-and-drop simplicity. Collect everything from contact details to waivers, documents, and member preferences — all tailored to your club's needs.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="p-6">
                            <CardHeader>
                                <Users className="h-12 w-12 text-primary mb-4" />
                                <CardTitle>Lightning Fast</CardTitle>
                                <CardDescription>
                                Keep your member database clean and up to date automatically. Track registrations, view activity history, and manage approvals or statuses in one centralized system.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="p-6">
                            <CardHeader>
                                <Mail className="h-12 w-12 text-primary mb-4" />
                                <CardTitle>Email & Communication Tools</CardTitle>
                                <CardDescription>
                                Send professional emails to members or groups with built-in filters and segments. Automate reminders, confirmations, or event updates — no third-party tools required.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container px-4 mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        Join and start using clubby
                    </p>
                    <Button size="lg" className="font-semibold" onClick={() => navigate("/register")}>
                        Start Today
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </section>
        </div>
    )
}