import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Calendar, CreditCard, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketingHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">
          Effortless Club Management, Modern Member Experience
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          Streamline your club’s operations, boost member engagement, and grow
          your community with our all-in-one platform.
        </p>
        <Button
          size="lg"
          className="px-8 py-6 text-lg font-semibold shadow-lg"
          onClick={() => navigate("/contactus")}
        >
          Get Started
        </Button>
      </section>

      {/* Value Propositions */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
          <Users className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-bold text-lg mb-2">Member Management</h3>
          <p className="text-muted-foreground text-sm">
            Register, track, and engage members with ease. Automated onboarding,
            renewals, and communication.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
          <Calendar className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-bold text-lg mb-2">Bookings & Events</h3>
          <p className="text-muted-foreground text-sm">
            Effortlessly manage venue bookings, events, and schedules. Real-time
            availability and reminders.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center">
          <CreditCard className="h-10 w-10 text-primary mb-3" />
          <h3 className="font-bold text-lg mb-2">Payments & Reporting</h3>
          <p className="text-muted-foreground text-sm">
            Secure online payments, automated invoicing, and insightful
            financial reports at your fingertips.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Why Choose Us?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">All-in-One Platform</h4>
              <p className="text-muted-foreground text-sm">
                Manage everything from memberships to events, payments, and
                communications in one place.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Secure & Reliable</h4>
              <p className="text-muted-foreground text-sm">
                Your data and payments are protected with industry-leading
                security and privacy standards.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Customizable & Scalable</h4>
              <p className="text-muted-foreground text-sm">
                Tailor the platform to your club’s unique needs. Grow without
                limits as your community expands.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">World-Class Support</h4>
              <p className="text-muted-foreground text-sm">
                Our expert team is here to help you succeed, every step of the
                way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to join existing clubs?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Join hundreds of clubs already using our platform to save time,
          increase engagement, and grow their communities.
        </p>
        <Button
          size="lg"
          className="px-8 py-6 text-lg font-semibold shadow-lg"
          onClick={() => navigate("/login")}
        >
          Sign In
        </Button>
      </section>
    </div>
  );
}
