import { useMemo } from "react";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export default function PrivacyPage() {
  const lastUpdated = "17 December 2025";
  const contactEmail = "your@email.com";

  const sections: Section[] = useMemo(
    () => [
      {
        id: "overview",
        title: "Overview",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubby respects your privacy and is committed to protecting
              personal information in accordance with South Africa’s{" "}
              <span className="font-medium text-foreground">POPIA</span>, and
              the <span className="font-medium text-foreground">GDPR</span>{" "}
              where applicable.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note:</span> Clubs
                using Clubby are typically responsible for the member data they
                collect. Clubby generally provides the platform and processes
                data on their behalf.
              </p>
            </div>
          </>
        ),
      },
      {
        id: "what-we-collect",
        title: "Information We Collect",
        body: (
          <>
            <p className="text-sm text-muted-foreground">We may collect:</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Names and contact details",
                "Club membership and registration information",
                "Communication logs (e.g. emails/SMS sent via the Platform)",
                "Device and usage data (e.g. IP address, browser type, basic analytics)",
                "Information about minors (provided to us by clubs)",
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
        id: "how-we-use",
        title: "How We Use Information",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              We use personal information to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Operate and improve the Platform",
                "Manage registrations and membership administration",
                "Communicate with users (transactional email/SMS)",
                "Ensure platform security and prevent abuse",
                "Comply with legal obligations",
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
        id: "lawful-basis",
        title: "Lawful Basis (Where Applicable)",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Depending on the context and applicable law, we may process
              personal information based on:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Performance of a contract (providing the Platform)",
                "Legitimate interests (security, improvements, support)",
                "Consent (where required, especially marketing)",
                "Legal obligations",
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
        id: "minors",
        title: "Minors’ Data",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubby does{" "}
              <span className="font-semibold text-foreground">not</span>{" "}
              directly collect data from children. Where minors’ data is
              processed:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Clubs uploading minors’ data confirm parental/legal guardian consent",
                "We apply enhanced safeguards to children’s information",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Clubs are responsible
                </span>{" "}
                for obtaining and retaining parental/legal guardian consent for
                minor members.
              </p>
            </div>
          </>
        ),
      },
      {
        id: "sharing",
        title: "Sharing of Information",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              We may share information with:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Service providers (e.g. hosting, email delivery, SMS delivery, analytics)",
                "Legal authorities where required by law",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                We do <span className="font-semibold text-foreground">not</span>{" "}
                sell personal information.
              </p>
            </div>
          </>
        ),
      },
      {
        id: "security",
        title: "Data Storage & Security",
        body: (
          <p className="text-sm text-muted-foreground">
            We use reasonable technical and organisational measures to protect
            personal information. Data may be stored on secure cloud
            infrastructure.
          </p>
        ),
      },
      {
        id: "retention",
        title: "Data Retention",
        body: (
          <p className="text-sm text-muted-foreground">
            We retain personal information only as long as necessary for
            Platform operations, support, legal/regulatory compliance, and
            resolving disputes.
          </p>
        ),
      },
      {
        id: "your-rights",
        title: "Your Rights",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Subject to applicable law, you may request to:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Access your personal information",
                "Correct inaccurate information",
                "Request deletion (where applicable)",
                "Object to processing or withdraw consent (where applicable)",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <p className="text-sm text-muted-foreground">
                To exercise your rights, contact:{" "}
                <a
                  className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
              </p>
            </div>
          </>
        ),
      },
      {
        id: "cookies",
        title: "Cookies",
        body: (
          <>
            <p className="text-sm text-muted-foreground">
              Clubby uses cookies (or similar technologies) for:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Authentication and session management",
                "Analytics and performance",
                "Security",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              You can control cookies via your browser settings.
            </p>
          </>
        ),
      },
      {
        id: "international",
        title: "International Transfers",
        body: (
          <p className="text-sm text-muted-foreground">
            If personal information is processed or stored outside South Africa,
            we take steps to ensure appropriate safeguards are in place as
            required by applicable law.
          </p>
        ),
      },
      {
        id: "updates",
        title: "Policy Updates",
        body: (
          <p className="text-sm text-muted-foreground">
            We may update this policy from time to time. Changes will be posted
            on the Platform with an updated “Last updated” date.
          </p>
        ),
      },
      {
        id: "children-addendum",
        title: "Children Data Handling Addendum",
        body: (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Clubs are responsible for obtaining and maintaining parental/legal guardian consent.",
                "Clubby generally acts as a data processor/operator for clubs’ member data.",
                "Clubs remain responsible for lawful collection and instructions for processing.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: "contact",
        title: "Contact",
        body: (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">
              Privacy questions or requests:{" "}
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
    ],
    [contactEmail],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Anchor for "Back to top" */}
      <div id="top" />

      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              <span className="font-medium text-foreground">{lastUpdated}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              This policy explains how Clubby handles personal information.
              Replace placeholders (date, email) before publishing. A lawyer
              review is recommended, especially if you expand internationally or
              enable payments.
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
