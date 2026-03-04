import { useMemo } from "react";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export default function TermsPage() {
  const lastUpdated = "17 December 2025";
  const contactEmail = "your@email.com";

  const sections: Section[] = useMemo(
    () => [
      {
        id: "intro",
        title: "Introduction",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              These Terms and Conditions (“Terms”) govern your access to and use
              of <span className="font-medium text-foreground">Clubby</span>{" "}
              (“the Platform”, “we”, “us”, “our”). By accessing or using Clubby,
              you agree to be bound by these Terms.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If you do not agree, you may not use the Platform.
            </p>
          </>
        ),
      },
      {
        id: "what-clubby-does",
        title: "What Clubby Does",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubby is a digital platform that enables clubs, organisations,
              and individuals to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Create and manage club registrations",
                "Collect member information",
                "Communicate with members",
                "Manage administrative workflows",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Important:</span>{" "}
                Clubby does{" "}
                <span className="font-semibold text-foreground">not</span>{" "}
                operate or manage clubs, and is not responsible for club
                activities, training, events, or safety.
              </p>
            </div>
          </>
        ),
      },
      {
        id: "eligibility",
        title: "Eligibility",
        body: (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "You must be 18 years or older to create an account.",
              "Clubs may register minors as members, provided the club has obtained parental or legal guardian consent.",
              "By registering minors, clubs confirm they are legally authorised to provide the minor’s information.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        id: "accounts",
        title: "Accounts & Responsibilities",
        body: (
          <>
            <p className="text-sm text-muted-foreground">You agree to:</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Provide accurate and complete information",
                "Keep login details secure",
                "Notify us immediately of unauthorised access",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              You are responsible for all activity under your account.
            </p>
          </>
        ),
      },
      {
        id: "clubs-and-data",
        title: "Clubs & Member Data",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubs using Clubby are generally considered the{" "}
              <span className="font-medium text-foreground">
                primary data controllers
              </span>{" "}
              of their members’ information (where applicable).
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Clubs confirm that:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "They have lawful permission to collect and upload member data",
                "They comply with all applicable data protection laws",
                "They are responsible for the accuracy of the data",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "communications",
        title: "Communications",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              By using Clubby, you consent to receiving:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Transactional emails or SMS (e.g. verification, reminders)",
                "System notifications related to platform usage and security",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Marketing communications will only be sent where legally permitted
              and can be opted out of.
            </p>
          </>
        ),
      },
      {
        id: "payments",
        title: "Payments (Future)",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubby may introduce paid features in the future. If so:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Pricing will be clearly communicated before you are charged",
                "Separate payment terms may apply",
                "Third-party payment processors may be used",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "prohibited-use",
        title: "Prohibited Use",
        body: (
          <>
            <p className="text-sm text-muted-foreground">You may not:</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Use Clubby for unlawful purposes",
                "Upload false, misleading, or harmful content",
                "Attempt to breach platform security",
                "Misuse member data or access data without authorisation",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "ip",
        title: "Intellectual Property",
        body: (
          <p className="text-sm text-muted-foreground">
            All platform content, branding, and software belong to Clubby or its
            licensors. You may not copy or reuse without permission.
          </p>
        ),
      },
      {
        id: "liability",
        title: "Limitation of Liability",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              To the maximum extent permitted by law:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Clubby is provided “as is”",
                "We are not liable for injuries, losses, or damages arising from club activities",
                "We are not responsible for disputes between clubs and members",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "indemnity",
        title: "Indemnity",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              You agree to indemnify Clubby against any claims arising from:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Your use of the platform",
                "Your breach of these Terms",
                "Your handling of member data",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "termination",
        title: "Termination",
        body: (
          <p className="text-sm text-muted-foreground">
            We may suspend or terminate access if these Terms are violated.
          </p>
        ),
      },
      {
        id: "governing-law",
        title: "Governing Law",
        body: (
          <p className="text-sm text-muted-foreground">
            These Terms are governed by the laws of{" "}
            <span className="font-medium text-foreground">South Africa</span>.
          </p>
        ),
      },
      {
        id: "contact",
        title: "Contact",
        body: (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">
              For questions, contact:{" "}
              <a
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                href={`mailto:${contactEmail}`}
              >
                {contactEmail}
              </a>
            </p>
          </div>
        ),
      },
      {
        id: "club-liability-notice",
        title: "Club Liability & Indemnity Notice",
        body: (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Clubby does not organise events or training",
                "Clubby does not supervise activities",
                "Clubby accepts no responsibility for injuries, accidents, or disputes",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Clubs agree to indemnify Clubby from claims arising from club
              activities, to the maximum extent permitted by law.
            </p>
          </div>
        ),
      },
    ],
    [contactEmail],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              <span className="font-medium text-foreground">{lastUpdated}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              This page is a general set of terms for using Clubby. Replace
              placeholders (date, email) before publishing. A lawyer review is
              recommended before enabling payments or scaling internationally.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[260px_1fr]">
        {/* Sticky nav */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-sm font-semibold">On this page</div>
            <div className="mt-3 space-y-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Sections */}
        <section className="space-y-6">
          {sections.map((s) => (
            <div
              key={s.id}
              id={s.id}
              className="rounded-xl border border-border bg-background p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {s.title}
                </h2>
                {/*<a
                  href="#top"
                  className="hidden text-xs text-muted-foreground hover:text-foreground lg:inline"
                  aria-label={`Back to top from ${s.title}`}
                >
                  Back to top
                </a>*/}
              </div>
              <div className="mt-3">{s.body}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
