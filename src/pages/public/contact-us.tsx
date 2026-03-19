import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Globe, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-background to-indigo-50">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in-50 duration-300">
              <MessageCircle className="w-4 h-4 mr-2" />
              Get in Touch
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-700">
              Let's Start a
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Conversation
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-200">
              Ready to transform your club management? We're here to help you
              every step of the way. Let's discuss how we can bring your vision
              to life.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Connect With Us</h2>
              <p className="text-muted-foreground">
                Choose the way that works best for you. We're always ready to
                help.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              {/* Email Card */}
              <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Send us a detailed message
                      </p>
                      <a
                        href="mailto:clubbysouthafrica@gmail.com"
                        className="text-primary hover:text-primary/80 font-medium flex items-center transition-colors"
                      >
                        clubbysouthafrica@gmail.com
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Card */}
              {/*<Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Speak directly with our team
                      </p>
                      <p className="text-green-600 font-medium">
                        Available during business hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>*/}

              {/* Location Card */}
              {/*<Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Come see us in person
                      </p>
                      <p className="text-blue-600 font-medium">
                        Cape Town, South Africa
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>*/}
            </div>

            {/* Business Hours */}
            {/*<Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-muted">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-2 text-primary" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span className="font-medium">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday</span>
                  <span className="font-medium">9:00 AM - 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </CardContent>
            </Card>*/}
          </div>

          {/* Contact Form */}
          {/*<div className="lg:col-span-3">
            <Card className="shadow-2xl shadow-primary/5 border-primary/20">
              <CardHeader className="pb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      Send us a Message
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Fill out the form below and we'll get back to you within
                      24 hours.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-semibold text-foreground"
                      >
                        First Name *
                      </label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="h-12 border-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="lastName"
                        className="text-sm font-semibold text-foreground"
                      >
                        Last Name *
                      </label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="h-12 border-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className="h-12 border-primary/20 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-semibold text-foreground"
                    >
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      placeholder="How can we help you today?"
                      className="h-12 border-primary/20 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold text-foreground"
                    >
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your club, your needs, and how we can help you succeed..."
                      className="min-h-[150px] border-primary/20 focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>We typically respond within 24 hours</span>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Send Message
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>*/}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-indigo-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
            <p className="text-muted-foreground">
              Join hundreds of clubs that have already transformed their
              management experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 shadow-lg"
                onClick={() => navigate("/clubs")}
              >
                <Globe className="w-4 h-4 mr-2" />
                Browse Clubs
              </Button>
              {/*<Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/5">
                                <MessagesSquare className="w-4 h-4 mr-2" />
                                Live Chat
                            </Button>*/}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
