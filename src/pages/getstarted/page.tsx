import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  Search,
  Crown,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star,
  Zap,
  Heart,
  Globe,
  Shield,
  Rocket,
} from "lucide-react";
import Pager from "@/components/pager";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    id: 1,
    title: "Create Your Account",
    icon: <UserPlus className="w-6 h-6" />,
    description: "Join our community and unlock your potential",
    details:
      "Sign up with your email and create a secure account to get started with your club management journey.",
    action: "Sign Up Now",
    link: "/register",
    color: "from-blue-500 to-purple-600",
    bgColor: "bg-blue-50",
    completed: false,
  },
  {
    id: 2,
    title: "Discover Clubs",
    icon: <Search className="w-6 h-6" />,
    description: "Find the perfect clubs that match your interests",
    details:
      "Browse through our extensive catalog of clubs and find communities that align with your passions and goals.",
    action: "Browse Clubs",
    link: "/clubs",
    color: "from-green-500 to-teal-600",
    bgColor: "bg-green-50",
    completed: false,
  },
  {
    id: 3,
    title: "Join & Connect",
    icon: <Users className="w-6 h-6" />,
    description: "Become a member and start connecting",
    details:
      "Join your chosen clubs, meet like-minded people, and participate in exciting activities and events.",
    action: "Join a Club",
    link: "/clubs",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    completed: false,
  },
  {
    id: 4,
    title: "Manage & Grow",
    icon: <Crown className="w-6 h-6" />,
    description: "Take control of your club experience",
    details:
      "Access your dashboard, manage memberships, track activities, and watch your community engagement grow.",
    action: "View Dashboard",
    link: "/myclubs",
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50",
    completed: false,
  },
];

const features = [
  {
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    title: "Secure & Reliable",
    description: "Your data is protected with enterprise-grade security",
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-600" />,
    title: "Lightning Fast",
    description: "Optimized performance for seamless user experience",
  },
  {
    icon: <Heart className="w-6 h-6 text-red-600" />,
    title: "Community Focused",
    description: "Built by the community, for the community",
  },
  {
    icon: <Globe className="w-6 h-6 text-green-600" />,
    title: "Global Reach",
    description: "Connect with clubs and members worldwide",
  },
];

export default function GetStartedPage() {
  const navigate = useNavigate();

  return (
    <Pager>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-in fade-in-50 duration-300">
                <Rocket className="w-4 h-4 mr-2" />
                Your Journey Starts Here
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Get Started with
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Club Management
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12">
                Join thousands of users who have transformed their club
                experience. Follow our simple 4-step process to unlock the full
                potential of community management.
              </p>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-16"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Progress
                </span>
                <span className="text-sm font-medium text-primary">
                  0% Complete
                </span>
              </div>
              <Progress value={0} className="h-3 bg-muted/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Complete all steps to unlock your full potential
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-4">Your Path to Success</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these carefully crafted steps to make the most of your
                club management experience
              </p>
            </motion.div>
          </div>

          <div className="grid gap-8 md:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Card className="relative overflow-hidden border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                      {/* Step Number & Icon */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="relative">
                          <div
                            className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          >
                            {step.icon}
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-md">
                            {step.id}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-lg text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.details}
                          </p>
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center justify-between pt-4">
                          <Badge
                            variant={step.completed ? "default" : "secondary"}
                            className="flex items-center gap-1"
                          >
                            {step.completed ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Star className="w-3 h-3" />
                            )}
                            {step.completed ? "Completed" : "Ready to Start"}
                          </Badge>

                          <Button
                            onClick={() => navigate(step.link)}
                            className={`z-10 bg-gradient-to-r ${step.color} hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300 group/btn`}
                          >
                            {step.action}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-r from-muted/30 to-muted/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with modern technology and designed for the future of club
                management
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="text-center h-full border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-12">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Join thousands of satisfied users and transform your club
                    management experience today. It only takes a few minutes to
                    get started.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                      size="lg"
                      onClick={() => navigate("/register")}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/clubs")}
                      className="border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Browse Clubs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Pager>
  );
}
