import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, UserRoundX } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchClub } from "@/queries/clubs";
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
    <div className="mx-auto w-full max-w-md space-y-3">
      <Skeleton className="mx-auto h-20 w-20 rounded-full sm:h-28 sm:w-28" />
      <Skeleton className="mx-auto h-5 w-40 sm:h-7 sm:w-56" />
      <Skeleton className="h-[26rem] w-full rounded-[2rem] sm:h-[34rem]" />
    </div>
  );
}

export default function PublicMemberVerificationPage() {
  const { clubId, memberUserId } = useParams<{
    clubId: string;
    memberUserId: string;
  }>();
  const [searchParams] = useSearchParams();
  const { data: clubData } = useFetchClub(clubId || "", Boolean(clubId));

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
  const clubDisplayName = useMemo(
    () => clubName || clubData?.club_name?.trim() || "Club member status",
    [clubData?.club_name, clubName],
  );
  const clubProfileImage = clubData?.club_profile_url?.trim() || "";
  const clubInitials = useMemo(() => {
    const initials = clubDisplayName
      .split(" ")
      .filter((value: string) => Boolean(value.trim()))
      .slice(0, 2)
      .map((value: string) => value[0]?.toUpperCase() || "")
      .join("");

    return initials || "CM";
  }, [clubDisplayName]);

  const verificationTone = useMemo(
    () => getVerificationTone(data, dataUpdatedAt),
    [data, dataUpdatedAt],
  );
  const VerificationIcon = verificationTone.icon;

  if (!clubId || !memberUserId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.75),_transparent_45%),linear-gradient(180deg,_#fafaf9_0%,_#f1f5f9_100%)] px-4 py-12">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.65),_transparent_35%),linear-gradient(180deg,_#fafaf9_0%,_#f1f5f9_100%)] px-3 py-3 sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-md flex-col gap-2.5 sm:gap-5">
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500 sm:text-xs">
            Public membership verification
          </p>
        </div>

        {isLoading ? <VerificationSkeleton /> : null}

        {!isLoading && isError ? (
          <Card className="overflow-hidden rounded-[2rem] border-rose-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
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
            <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_28px_90px_-54px_rgba(15,23,42,0.45)] sm:rounded-[2rem]">
              <CardContent className="p-0">
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95)_0%,_rgba(241,245,249,0.9)_100%)] px-4 pb-4 pt-5 text-center sm:px-7 sm:pb-6 sm:pt-8">
                  <Avatar className="mx-auto h-20 w-20 border-4 border-white bg-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] sm:h-32 sm:w-32">
                    <AvatarImage className="object-cover object-center" src={clubProfileImage} alt={clubDisplayName} />
                    <AvatarFallback className="bg-slate-100 text-lg font-semibold text-slate-700 sm:text-3xl">
                      {clubInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500 sm:text-xs">
                      {clubDisplayName}
                    </p>
                    <h1 className="text-lg font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {fullName || "Unknown member"}
                    </h1>
                  </div>
                </div>

                <div className="px-3 py-3 sm:px-6 sm:py-6">
                  <div className={cn("rounded-[1.25rem] border px-3 py-3 sm:rounded-[1.5rem] sm:px-5 sm:py-5", verificationTone.panelClassName)}>
                    <div className="flex items-start gap-2.5 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/80 shadow-sm sm:h-14 sm:w-14">
                        <VerificationIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                      </div>
                      <div className="min-w-0 space-y-1.5 sm:space-y-2">
                        <Badge className={cn("border px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs", verificationTone.badgeClassName)}>
                          {verificationTone.badgeLabel}
                        </Badge>
                        <div>
                          <h2 className="text-sm font-semibold tracking-tight sm:text-xl">
                            {verificationTone.title}
                          </h2>
                          <p className="mt-0.5 text-[11px] leading-4.5 opacity-90 sm:mt-1 sm:text-sm sm:leading-6">
                            {verificationTone.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:mt-4 sm:rounded-[1.25rem] sm:px-4 sm:py-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500 sm:text-xs">
                      Membership credential
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        <div className="flex justify-center">
          <Button asChild variant="outline" className="h-8 rounded-full bg-white px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
            <Link to={`/clubs/${clubId}`}>View club</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
