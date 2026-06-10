import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  AlertCircle,
  Camera,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClubMember, type GetClubMemberResponse } from "@/services/admin/club-members";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

type MemberVerificationScannerDialogProps = {
  clubId: string;
};

type VerificationTone = {
  title: string;
  description: string;
  badgeLabel: string;
  badgeClassName: string;
  panelClassName: string;
  icon: typeof ShieldCheck;
};

function getVerificationTone(response?: GetClubMemberResponse): VerificationTone {
  if (response?.message === "User not found") {
    return {
      title: "Member record not found",
      description: "We could not find a user record for this QR code in the club member service.",
      badgeLabel: "Not found",
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
      panelClassName: "border-slate-200 bg-slate-50 text-slate-800",
      icon: UserRoundX,
    };
  }

  if (!response?.is_club_member) {
    return {
      title: "Not part of this club",
      description: "The scanned user is not currently linked to this club member record.",
      badgeLabel: "Not verified",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      panelClassName: "border-rose-200 bg-rose-50 text-rose-900",
      icon: ShieldAlert,
    };
  }

  if (response.registration?.startsWith("DEREGISTERED")) {
    return {
      title: "Previously registered member",
      description: "The scanned user has a club member record, but their latest registration is deregistered.",
      badgeLabel: response.registration,
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      panelClassName: "border-rose-200 bg-rose-50 text-rose-900",
      icon: ShieldAlert,
    };
  }

  if (response.registration === "PENDING") {
    return {
      title: "Pending approval",
      description: "The scanned user is linked to the club, but their current registration is still pending.",
      badgeLabel: "Pending",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      panelClassName: "border-amber-200 bg-amber-50 text-amber-900",
      icon: ShieldAlert,
    };
  }

  return {
    title: "Verified club member",
    description: "The scanned user is currently linked to this club according to the membership endpoint.",
    badgeLabel: response?.registration || "Registered",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panelClassName: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: ShieldCheck,
  };
}

function extractMemberVerificationDetails(rawValue: string) {
  const trimmedValue = rawValue.trim();
  const directMatch = trimmedValue.match(/\/clubs\/([^/?#]+)\/member-verification\/([^/?#]+)/i);

  if (directMatch) {
    return {
      scannedClubId: directMatch[1],
      memberUserId: directMatch[2],
    };
  }

  try {
    const parsedUrl = new URL(trimmedValue, "https://scanner.local");
    const pathnameMatch = parsedUrl.pathname.match(/\/clubs\/([^/?#]+)\/member-verification\/([^/?#]+)/i);

    if (pathnameMatch) {
      return {
        scannedClubId: pathnameMatch[1],
        memberUserId: pathnameMatch[2],
      };
    }
  } catch {
    return {
      scannedClubId: null,
      memberUserId: null,
    };
  }

  return {
    scannedClubId: null,
    memberUserId: null,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to access the camera right now. Check camera permissions and try again.";
}

function getRegistrationsTab(response?: GetClubMemberResponse) {
  if (response?.registration?.startsWith("DEREGISTERED")) {
    return "previous-members";
  }

  if (response?.registration === "PENDING") {
    return "pending-members";
  }

  return "registered-members";
}

export default function MemberVerificationScannerDialog({
  clubId,
}: MemberVerificationScannerDialogProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [isDifferentClubScan, setIsDifferentClubScan] = useState(false);
  const [scannedMemberUserId, setScannedMemberUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const hasScannedRef = useRef(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["member-qr-verification", clubId, scannedMemberUserId],
    queryFn: () => getClubMember(clubId, scannedMemberUserId || ""),
    enabled: Boolean(clubId && scannedMemberUserId && !isDifferentClubScan),
    retry: 1,
  });

  const fullName = useMemo(() => {
    const names = [data?.user?.first_name, data?.user?.surname]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());

    return names.join(" ");
  }, [data?.user?.first_name, data?.user?.surname]);
  const shouldShowIdentityDetails = Boolean(data?.is_club_member) && !isDifferentClubScan;

  const verificationTone = useMemo(() => {
    if (isDifferentClubScan) {
      return {
        title: "Not associated with this club",
        description: "This QR code was issued for a different club and cannot be used to verify membership here.",
        badgeLabel: "Different club",
        badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
        panelClassName: "border-rose-200 bg-rose-50 text-rose-900",
        icon: ShieldAlert,
      };
    }

    return getVerificationTone(data);
  }, [data, isDifferentClubScan]);
  const VerificationIcon = verificationTone.icon;
  const showScannerPreview = !scannedMemberUserId;

  const stopScanner = useCallback((options?: { clearPreview?: boolean }) => {
    const { clearPreview = true } = options ?? {};

    try {
      controlsRef.current?.stop();
    } catch {
      // Ignore stop errors from already-disposed scanner controls.
    }

    controlsRef.current = null;
    hasScannedRef.current = false;

    const currentVideo = videoRef.current;
    const currentStream = currentVideo?.srcObject;

    if (currentStream instanceof MediaStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }

    if (currentVideo && clearPreview) {
      currentVideo.srcObject = null;
    }

  }, []);

  const resetScanState = useCallback(() => {
    setIsProcessingScan(false);
    setScanError(null);
    setScanWarning(null);
    setIsDifferentClubScan(false);
    setScannedMemberUserId(null);
  }, []);

  const handleScanAnotherCode = useCallback(() => {
    stopScanner();
    resetScanState();
  }, [resetScanState, stopScanner]);

  const handleGoToMember = useCallback(() => {
    if (!scannedMemberUserId) {
      return;
    }

    setOpen(false);
    navigate(
      `/manage/members?memberId=${encodeURIComponent(scannedMemberUserId)}#${encodeURIComponent(scannedMemberUserId)}`,
    );
  }, [navigate, scannedMemberUserId]);

  const handleGoToRegistration = useCallback(() => {
    if (!scannedMemberUserId) {
      return;
    }

    const params = new URLSearchParams({
      tab: getRegistrationsTab(data),
      memberId: scannedMemberUserId,
      source: "qr-scanner",
    });

    if (data?.registration_id?.trim()) {
      params.set("registrationId", data.registration_id);
    }

    setOpen(false);
    navigate(`/manage/member/registrations?${params.toString()}`);
  }, [data, navigate, scannedMemberUserId]);

  useEffect(() => {
    if (searchParams.get("scanner") !== "member-verification") {
      return;
    }

    setOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("scanner");
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Camera scanning is not supported in this browser.");
      return;
    }

    stopScanner();
    resetScanState();
    setIsStartingCamera(true);

    try {
      readerRef.current ??= new BrowserQRCodeReader();
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, _error, controls) => {
          if (!result || hasScannedRef.current) {
            return;
          }

          hasScannedRef.current = true;

          const rawText = result.getText();
          const parsed = extractMemberVerificationDetails(rawText);

          if (!parsed.memberUserId) {
            setIsProcessingScan(false);
            setScanError(
              "This QR code does not contain a membership verification link.",
            );
            queueMicrotask(() => {
              try {
                controls.stop();
              } catch {
                // Ignore stop errors after invalid scans.
              }
            });
            return;
          }

          setIsProcessingScan(true);
          setScannedMemberUserId(parsed.memberUserId);

          if (parsed.scannedClubId && parsed.scannedClubId !== clubId) {
            setIsDifferentClubScan(true);
            setIsProcessingScan(false);
            setScanWarning(
              "This QR code was issued for a different club.",
            );
          } else {
            setIsDifferentClubScan(false);
          }

          queueMicrotask(() => {
            try {
              controls.stop();
            } catch {
              // Ignore stop errors from race conditions inside the scanner loop.
            }
            controlsRef.current = null;
            setIsStartingCamera(false);
          });
        },
      );
    } catch (error) {
      setScanError(getErrorMessage(error));
    } finally {
      setIsStartingCamera(false);
    }
  }, [clubId, resetScanState, stopScanner]);

  useEffect(() => {
    if (scanError) {
      setIsProcessingScan(false);
    }
  }, [scanError]);

  useEffect(() => {
    if (!isFetching) {
      setIsProcessingScan(false);
    }
  }, [isFetching]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      resetScanState();
      return;
    }

    if (!showScannerPreview) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      void startScanner();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      stopScanner();
    };
  }, [open, resetScanState, showScannerPreview, startScanner, stopScanner]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 rounded-full border-stone-300 bg-white/85 px-3 text-xs text-zinc-700 backdrop-blur hover:bg-white"
      >
        <Camera className="mr-2 h-4 w-4" />
        Scan membership QR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-xl flex-col gap-3 overflow-hidden rounded-[24px] border-slate-200 bg-white p-3 sm:w-full sm:gap-4 sm:rounded-[28px] sm:p-6">
          <DialogHeader className="shrink-0 pr-8 sm:pr-10">
            <DialogTitle>Scan membership QR code</DialogTitle>
            <DialogDescription>
              Open the camera, scan the member's registration QR code, and verify whether they belong to this club.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 sm:space-y-4">
            {showScannerPreview ? (
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-950 sm:rounded-[24px]">
                <div className="relative aspect-[4/3] w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 border-[12px] border-slate-950/45 sm:border-[18px]" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-[28px] border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.18)] sm:h-64 sm:w-64 sm:rounded-[32px]" />
                  {isStartingCamera ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                      <Loader2 className="h-7 w-7 animate-spin text-white" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {scanError ? (
              <div className="flex items-start gap-2 rounded-[18px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{scanError}</p>
              </div>
            ) : null}

            {scanWarning ? (
              <div className="flex items-start gap-2 rounded-[18px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{scanWarning}</p>
              </div>
            ) : null}

            {isProcessingScan || isFetching ? (
              <div className="flex items-center gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>QR detected. Checking the scanned member against this club...</p>
              </div>
            ) : null}

            {scannedMemberUserId && !isFetching ? (
              <Card className="overflow-hidden rounded-[20px] border border-slate-200 shadow-sm sm:rounded-[24px]">
                <CardContent className="p-0">
                  <div className={cn("border-b px-3 py-3 sm:px-4 sm:py-4", verificationTone.panelClassName)}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm sm:h-12 sm:w-12">
                        <VerificationIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Badge className={cn("max-w-full whitespace-normal border px-2 py-0.5 text-[10px] font-semibold leading-tight", verificationTone.badgeClassName)}>
                          {verificationTone.badgeLabel}
                        </Badge>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                            {verificationTone.title}
                          </h3>
                          <p className="mt-1 text-sm leading-5 opacity-90">
                            {verificationTone.description}
                          </p>
                          {shouldShowIdentityDetails ? (
                            <div className="mt-3 rounded-[16px] border border-white/50 bg-white/45 px-3 py-2.5 text-slate-950 backdrop-blur-sm">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-70">
                                Member name
                              </p>
                              <p className="mt-1 text-sm font-semibold sm:text-base">
                                {fullName || "Unknown member"}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {shouldShowIdentityDetails ? (
                    <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" onClick={handleGoToMember} className="w-full sm:w-auto">
                          Go to member
                        </Button>
                        <Button type="button" variant="outline" onClick={handleGoToRegistration} className="w-full sm:w-auto">
                          Go to registration
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {isError && !isFetching ? (
              <div className="flex items-start gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>The club member service could not be reached for this scan.</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
            {!showScannerPreview ? (
              <Button type="button" onClick={handleScanAnotherCode} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Scan another code
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}