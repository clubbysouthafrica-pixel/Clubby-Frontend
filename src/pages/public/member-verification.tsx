import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, ShieldCheck, UserRoundX } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getClubMember,
  type GetClubMemberResponse,
} from "@/services/club-members";
import { cn } from "@/lib/utils";

type VerificationTone = {
  title: string;
  description: string;
  badgeLabel: string;
  badgeClassName: string;
  panelClassName: string;
  icon: typeof ShieldCheck;
};

function formatVerificationTimestamp(timestamp?: number) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function appendVerificationTimestamp(description: string, timestamp?: number) {
  const formattedTimestamp = formatVerificationTimestamp(timestamp);

  if (!formattedTimestamp) {
    return description;
  }

  return `${description} Verified on ${formattedTimestamp}.`;
}

function getVerificationTone(
  response?: GetClubMemberResponse,
  verifiedAt?: number,
): VerificationTone {
  if (response?.message === "User not found") {
    return {
      title: "Member record not found",
      description: appendVerificationTimestamp(
        "We could not find a user record for this verification link. Ask the club to generate a new verification code if needed.",
        verifiedAt,
      ),
      badgeLabel: "Not found",
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
      panelClassName: "border-slate-200 bg-slate-50 text-slate-800",
      icon: UserRoundX,
    };
  }

  if (!response?.is_club_member) {
    return {
      title: "Membership could not be verified",
      description: appendVerificationTimestamp(
        "This user is not currently linked to the club member record returned by the verification service.",
        verifiedAt,
      ),
      badgeLabel: "Not verified",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      panelClassName: "border-rose-200 bg-rose-50 text-rose-900",
      icon: ShieldAlert,
    };
  }

  if (response.registration?.startsWith("DEREGISTERED")) {
    return {
      title: "Member was previously registered",
      description: appendVerificationTimestamp(
        "This person has a club member record, but their latest registration status is deregistered and should not be treated as an active current registration.",
        verifiedAt,
      ),
      badgeLabel: response.registration,
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      panelClassName: "border-amber-200 bg-amber-50 text-amber-900",
      icon: ShieldAlert,
    };
  }

  if (response.registration === "PENDING") {
    return {
      title: "Membership is pending review",
      description: appendVerificationTimestamp(
        "This user is linked to the club, but their latest registration is still pending and has not been fully approved yet.",
        verifiedAt,
      ),
      badgeLabel: "Pending",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
      panelClassName: "border-sky-200 bg-sky-50 text-sky-900",
      icon: ShieldAlert,
    };
  }

  return {
    title: "Member verified",
    description: appendVerificationTimestamp(
      "This user is registered with the club according to the latest club member verification check.",
      verifiedAt,
    ),
    badgeLabel: response?.registration || "Registered",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panelClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: ShieldCheck,
  };
}

function VerificationSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-52 w-full rounded-3xl" />
    </div>
  );
}

export default function PublicMemberVerificationPage() {
  const { clubId, memberUserId } = useParams<{
    clubId: string;
    memberUserId: string;
  }>();
  const [searchParams] = useSearchParams();

  const { data, dataUpdatedAt, isLoading, isError } = useQuery({
    queryKey: ["public-member-verification", clubId, memberUserId],
    queryFn: () => getClubMember(clubId || "", memberUserId || ""),
    enabled: Boolean(clubId && memberUserId),
    retry: 1,
  });

  const fullName = useMemo(() => {
    const names = [data?.user?.first_name, data?.user?.surname]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());

    return names.join(" ");
  }, [data?.user?.first_name, data?.user?.surname]);
  const clubName = useMemo(() => searchParams.get("clubName")?.trim() || "", [searchParams]);

  const verificationTone = useMemo(
    () => getVerificationTone(data, dataUpdatedAt),
    [data, dataUpdatedAt],
  );
  const VerificationIcon = verificationTone.icon;

  if (!clubId || !memberUserId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.9),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-12">
        <Card className="mx-auto max-w-2xl border-slate-200 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle>Invalid verification link</CardTitle>
            <CardDescription>
              This QR code is missing the club or member identifier required to verify the registration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.45),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <Badge className="border border-slate-200 bg-white px-3 py-1 text-slate-700 shadow-sm">
            Public membership verification
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {clubName ? `${clubName}` : "Club member status"}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            This page checks whether the scanned member is currently associated with the club and shows the latest registration status returned by the verification endpoint.
          </p>
        </div>

        {isLoading ? <VerificationSkeleton /> : null}

        {!isLoading && isError ? (
          <Card className="border-rose-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>
                The verification service could not be reached. Please try again or confirm the QR code is still valid.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <Card className="overflow-hidden border-0 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <CardContent className="p-0">
                <div className={cn("border px-6 py-6 sm:px-8 sm:py-8", verificationTone.panelClassName)}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                      <Badge className={cn("border px-3 py-1 text-xs font-semibold", verificationTone.badgeClassName)}>
                        {verificationTone.badgeLabel}
                      </Badge>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {verificationTone.title}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 opacity-90 sm:text-base">
                          {verificationTone.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-sm">
                      <VerificationIcon className="h-10 w-10" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-slate-500" />
                  Verification details
                </CardTitle>
                <CardDescription>
                  Returned directly from the club member verification endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Club name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {clubName || "Unknown club"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Member name
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {fullName || "Unknown member"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        <div className="flex justify-center">
          <Button asChild variant="outline" className="bg-white">
            <Link to={`/clubs/${clubId}`}>View club</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
