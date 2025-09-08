import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Puzzle,
    Terminal,
} from "lucide-react";
import Pager from "@/components/pager";
import { motion } from "framer-motion";

const steps = [
    {
        title: "Register",
        icon: <Terminal className="w-6 h-6" />,
        command: "Register an account",
        description: "Register",
        tip: "Vite offers an extremely fast development experience",
    },
    {
        title: "Join a Club",
        icon: <Puzzle className="w-6 h-6" />,
        command: "Join your club",
        description: "View and Join club",
        tip: "These packages provide the foundation for your application",
    },
];

// const resources = [
//     {
//         title: "Documentation",
//         icon: <BookOpen className="w-6 h-6" />,
//         description: "Comprehensive guides and API references",
//         link: "#",
//     },
//     {
//         title: "Examples",
//         icon: <FileCode2 className="w-6 h-6" />,
//         description: "Ready-to-use code examples and templates",
//         link: "#",
//     },
//     {
//         title: "Playground",
//         icon: <Gamepad2 className="w-6 h-6" />,
//         description: "Interactive environment to test components",
//         link: "#",
//     },
//     {
//         title: "GitHub",
//         icon: <GitBranch className="w-6 h-6" />,
//         description: "Source code and community contributions",
//         link: "#",
//     },
// ];

export default function GetStartedPage() {
    return (
        <Pager>
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-bold mb-4">Get Started</h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Follow these steps and get started.
                        </p>
                    </motion.div>
                </div>

                {/* Progress Timeline */}
                <div className="max-w-3xl mx-auto mb-16">
                    <Progress value={25} className="mb-8" />
                    <div className="grid gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                {step.icon}
                                            </div>
                                            <div>
                                                <CardTitle>{step.title}</CardTitle>
                                                <CardDescription>{step.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className="bg-muted p-4 rounded-lg font-mono text-sm cursor-help">
                                                    {step.command}
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent>
                                                <p className="text-sm">{step.tip}</p>
                                            </HoverCardContent>
                                        </HoverCard>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Resources Section */}
                {/* <div className="mt-16">
                    <h2 className="text-2xl font-bold text-center mb-8">
                        Additional Resources
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {resources.map((resource, index) => (
                            <motion.div
                                key={resource.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                            >
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                                            {resource.icon}
                                        </div>
                                        <CardTitle>{resource.title}</CardTitle>
                                        <CardDescription>{resource.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" className="w-full" asChild>
                                            <a href={resource.link}>Learn More</a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div> */}

                {/* Help Section */}
                {/* <div className="mt-16 text-center">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Need Help?</CardTitle>
                            <CardDescription>
                                Our community is here to help you get started and answer any questions you may have.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4 justify-center">
                            <Button variant="outline">Join Discord</Button>
                            <Button>Contact Support</Button>
                        </CardContent>
                    </Card>
                </div> */}
            </div>
        </Pager>
    );
}