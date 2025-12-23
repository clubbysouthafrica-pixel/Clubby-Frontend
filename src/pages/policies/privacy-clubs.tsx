import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2 } from "lucide-react";

// Drop this component into your routes, e.g. /legal/registration-policy
// Tailwind & shadcn styles only (no typography plugin required)

export default function RegistrationPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          User Registration Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective: <span className="font-medium">17 December 2025</span> ·
          Last updated: <span className="font-medium">17 December 2025</span>
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            This User Registration Policy ("Policy") explains how Clubby ("we,"
            "us," "our") manages the registration process when users ("you,"
            "your") sign up to a club through the Clubby platform. Each club
            operates its own membership system and may request specific
            information through custom registration forms. By submitting a
            registration form on Clubby, you agree to this Policy and any
            additional policies of the club you are joining.
          </p>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <section className="space-y-8">
        <PolicySection title="Data Collection">
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Basic contact information (e.g., name, email address, phone
              number).
            </li>
            <li>
              Form responses requested by the club (e.g., membership type,
              experience level, emergency contact).
            </li>
            <li>
              Optional items such as profile photos or payment details if
              required for membership.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground">
            Each club may customize its registration form to collect data
            relevant to its membership requirements. Clubby does not control
            what questions are included in these custom forms but requires all
            clubs to comply with applicable data protection laws.
          </p>
        </PolicySection>

        <PolicySection title="Data Use">
          <ul className="ml-4 list-disc space-y-2">
            <li>Create or manage your membership profile within the club.</li>
            <li>
              Facilitate communication between you and the club’s
              administrators.
            </li>
            <li>Process membership payments or renewals (if applicable).</li>
            <li>Provide club-related updates, events, or notices.</li>
          </ul>
          <Callout>
            Clubby acts as a <b>data processor</b> on behalf of the club for
            custom registration forms. The club remains the
            <b> data controller</b> responsible for determining the purpose and
            means of processing your information.
          </Callout>
        </PolicySection>

        <PolicySection title="Data Sharing">
          <ul className="ml-4 list-disc space-y-2">
            <li>The club administrators you register with.</li>
            <li>
              Clubby’s internal systems to provide platform functionality.
            </li>
            <li>
              Third-party services only as necessary for payments, hosting, or
              support.
            </li>
          </ul>
          <p className="mt-4 font-medium">
            We do not sell or rent your personal data.
          </p>
        </PolicySection>

        <PolicySection title="User Responsibilities">
          <ul className="ml-4 list-disc space-y-2">
            <li>
              You confirm that all provided information is accurate and
              complete.
            </li>
            <li>
              You agree to comply with the club’s rules, membership terms, and
              code of conduct.
            </li>
            <li>
              You understand that the club may review or reject your
              registration at its discretion.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="Data Retention">
          <p>
            Your registration information will be retained for as long as you
            maintain an active membership with the club, or for the period
            required by the club for administrative or legal purposes.
          </p>
          <p className="mt-2">
            You may request deletion of your account or personal data through
            either the club administrator or Clubby support, subject to any
            legal obligations that require retention.
          </p>
        </PolicySection>

        <PolicySection title="Privacy & Security">
          <p>
            We implement reasonable technical and organizational measures to
            protect your information. However, Clubby cannot guarantee the
            security of data submitted through third-party or custom forms
            hosted by individual clubs.
          </p>
        </PolicySection>

        <PolicySection title="Changes to This Policy">
          <p>
            We may update this Policy from time to time. Updates take effect
            once published on the Clubby platform. Clubs may also issue
            additional notices that apply to their own registration processes.
          </p>
        </PolicySection>

        <PolicySection id="contact" title="Contact">
          <p>For any privacy or registration-related concerns:</p>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              Email:{" "}
              <a
                className="underline underline-offset-4"
                href="mailto:support@clubby.co.za"
              >
                support@clubby.co.za
              </a>
            </li>
            {/*<li>
              Address:{" "}
              <span className="text-muted-foreground">
                [Insert Business Address]
              </span>
            </li>*/}
          </ul>
        </PolicySection>
      </section>

      <div className="mt-10 rounded-2xl border p-5">
        <h3 className="mb-2 text-lg font-semibold tracking-tight">
          Quick Summary
        </h3>
        <ScrollArea className="max-h-48">
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              Your club’s form may ask for different details. Clubby requires
              clubs to follow applicable privacy laws.
            </li>
            <li>
              Clubs are data controllers; Clubby processes data for them to run
              membership workflows.
            </li>
            <li>
              Your information is shared with club admins and required third
              parties (e.g., payments/hosting) only.
            </li>
            <li>
              You can ask for data deletion via the club or Clubby support,
              subject to legal requirements.
            </li>
          </ul>
        </ScrollArea>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <span>Clear, startup‑friendly, legally neutral language.</span>
        </div>
      </div>
    </div>
  );
}

function PolicySection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
