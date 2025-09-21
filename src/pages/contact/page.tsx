import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Clock, MessagesSquare } from "lucide-react";
import Pager from "@/components/pager";

export default function ContactPage() {
    return (
        <Pager>
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Register a club</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        To get started, simply reach out to us with your details. Send us a message and we’ll get back to you as soon as possible to help you through the registration process.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                    <Mail className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Email</h3>
                                        <p className="text-muted-foreground">
                                            gregtorrington@icloud.com
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                    <MapPin className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Office</h3>
                                        <p className="text-muted-foreground">
                                            Cape Town, South Africa
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                    <Clock className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Hours</h3>
                                        <p className="text-muted-foreground">
                                            Monday - Friday: 8:00 AM - 6:00 PM
                                            <br />
                                            Saturday: 9:00 AM - 3:00 PM
                                            <br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Send us a Message</CardTitle>
                            <CardDescription>
                                Fill out the form below and we'll get back to you as soon as possible.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium">
                                            First Name
                                        </label>
                                        <Input id="firstName" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium">
                                            Last Name
                                        </label>
                                        <Input id="lastName" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <Input id="email" type="email" placeholder="john.doe@example.com" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">
                                        Subject
                                    </label>
                                    <Input id="subject" placeholder="How can we help?" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">
                                        Message
                                    </label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us about your inquiry..."
                                        className="min-h-[150px]"
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    <MessagesSquare className="w-4 h-4 mr-2" />
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* <div className="mt-16">
                    <h2 className="text-2xl font-bold text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    What are your business hours?
                                </AccordionTrigger>
                                <AccordionContent>
                                    We are open Monday through Friday from 8:00 AM to 6:00 PM, and
                                    Saturday from 9:00 AM to 3:00 PM. We are closed on Sundays and
                                    major holidays.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    How quickly do you respond to inquiries?
                                </AccordionTrigger>
                                <AccordionContent>
                                    We strive to respond to all inquiries within 24 business hours.
                                    For urgent matters, we recommend calling our support line directly.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    Do you offer remote consultations?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Yes, we offer remote consultations via video conferencing platforms.
                                    You can schedule a remote consultation through our online booking system.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger>
                                    What is your response time for support tickets?
                                </AccordionTrigger>
                                <AccordionContent>
                                    Support tickets are typically addressed within 4-8 business hours.
                                    Premium support customers receive priority response times.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div> */}
            </div>
        </Pager>
    );
}