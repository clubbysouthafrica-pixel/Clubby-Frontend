import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Users,
  Calendar,
  CreditCard,
  Shield,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketingHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="w-full px-4 py-24 flex flex-col items-center text-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1 mb-6 rounded-full bg-primary/10 text-primary font-medium tracking-wide text-sm">
            Modern Club Management
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Effortless Club Management
            <br />
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              For Modern Communities
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your club’s operations, boost member engagement, and grow
            your community with our all-in-one platform.
          </p>
          <Button
            size="lg"
            className="px-10 py-6 text-lg font-semibold shadow-lg"
            onClick={() => navigate("/contactus")}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="w-full py-12 bg-gradient-to-r from-white via-indigo-50 to-white border-y border-muted">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-8 bg-primary/30 rounded" />
            <span className="uppercase text-xs tracking-widest font-semibold text-muted-foreground">
              Trusted by leading clubs
            </span>
            <span className="h-px w-8 bg-primary/30 rounded" />
          </div>
          <div className="flex flex-wrap gap-8 justify-center items-center opacity-90">
            {/* Replace with your club/customer logos */}
            <img
              src="https://images.unsplash.com/photo-1773754767059-d645ebf55539?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Club 1"
              className="h-12 rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-300 bg-white"
            />
            <img
              src="https://images.unsplash.com/photo-1773754767059-d645ebf55539?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Club 2"
              className="h-12 rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-300 bg-white"
            />
            <img
              src="https://images.unsplash.com/photo-1773754767059-d645ebf55539?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Club 3"
              className="h-12 rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-300 bg-white"
            />
            <img
              src="https://images.unsplash.com/photo-1773754767059-d645ebf55539?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Club 4"
              className="h-12 rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-300 bg-white"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-10">
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center border border-muted">
          <Users className="h-10 w-10 text-primary mb-4" />
          <h3 className="font-bold text-xl mb-2">Member Management</h3>
          <p className="text-muted-foreground text-base">
            Register, track, and engage members with ease. Automated onboarding,
            renewals, and communication.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center border border-muted">
          <Calendar className="h-10 w-10 text-primary mb-4" />
          <h3 className="font-bold text-xl mb-2">Bookings & Events</h3>
          <p className="text-muted-foreground text-base">
            Effortlessly manage venue bookings, events, and schedules. Real-time
            availability and reminders.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center border border-muted">
          <CreditCard className="h-10 w-10 text-primary mb-4" />
          <h3 className="font-bold text-xl mb-2">Payments & Reporting</h3>
          <p className="text-muted-foreground text-base">
            Secure online payments, automated invoicing, and insightful
            financial reports at your fingertips.
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full bg-gradient-to-br from-indigo-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-7 w-7 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-1 text-lg">
                  All-in-One Platform
                </h4>
                <p className="text-muted-foreground text-base">
                  Manage everything from memberships to events, payments, and
                  communications in one place.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="h-7 w-7 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-1 text-lg">
                  Secure & Reliable
                </h4>
                <p className="text-muted-foreground text-base">
                  Your data and payments are protected with industry-leading
                  security and privacy standards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="h-7 w-7 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold mb-1 text-lg">
                  Customizable & Scalable
                </h4>
                <p className="text-muted-foreground text-base">
                  Tailor the platform to your club’s unique needs. Grow without
                  limits as your community expands.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Star className="h-7 w-7 text-yellow-500 mt-1" />
              <div>
                <h4 className="font-semibold mb-1 text-lg">
                  World-Class Support
                </h4>
                <p className="text-muted-foreground text-base">
                  Our expert team is here to help you succeed, every step of the
                  way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="w-full py-20 bg-white border-t">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Star className="h-8 w-8 text-yellow-400" />
            <Star className="h-8 w-8 text-yellow-400" />
            <Star className="h-8 w-8 text-yellow-400" />
            <Star className="h-8 w-8 text-yellow-400" />
            <Star className="h-8 w-8 text-yellow-400" />
          </div>
          <blockquote className="text-2xl font-semibold mb-4">
            “This platform has transformed the way we manage our club. The
            automation and support are unmatched.”
          </blockquote>
          <div className="text-muted-foreground text-lg">
            — Club Manager, Example Club
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-20 bg-gradient-to-br from-primary/10 to-white flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to transform your club?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Join hundreds of clubs already using our platform to save time,
          increase engagement, and grow their communities.
        </p>
        <Button
          size="lg"
          className="px-10 py-6 text-lg font-semibold shadow-lg"
          onClick={() => navigate("/contactus")}
        >
          Get Started
        </Button>
      </section>
    </div>
  );
}
