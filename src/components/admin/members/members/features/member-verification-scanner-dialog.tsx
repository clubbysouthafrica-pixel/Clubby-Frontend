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
import { useNavigate } from "react-router-dom";

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
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      panelClassName: "border-amber-200 bg-amber-50 text-amber-900",
      icon: ShieldAlert,
    };
  }

  if (response.registration === "PENDING") {
    return {
      title: "Pending approval",
      description: "The scanned user is linked to the club, but their current registration is still pending.",
      badgeLabel: "Pending",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
      panelClassName: "border-sky-200 bg-sky-50 text-sky-900",
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

export default function MemberVerificationScannerDialog({
  clubId,
}: MemberVerificationScannerDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [scannedMemberUserId, setScannedMemberUserId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const hasScannedRef = useRef(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["member-qr-verification", clubId, scannedMemberUserId],
    queryFn: () => getClubMember(clubId, scannedMemberUserId || ""),
    enabled: Boolean(clubId && scannedMemberUserId),
    retry: 1,
  });

  const fullName = useMemo(() => {
    const names = [data?.user?.first_name, data?.user?.surname]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());

    return names.join(" ");
  }, [data?.user?.first_name, data?.user?.surname]);
  const shouldShowIdentityDetails = Boolean(data?.is_club_member);

  const verificationTone = useMemo(() => getVerificationTone(data), [data]);
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
            setScanWarning(
              "This QR code was issued for a different club. Showing this person's status in the current club.",
            );
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
        <DialogContent className="max-w-xl rounded-[28px] border-slate-200 bg-white p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Scan membership QR code</DialogTitle>
            <DialogDescription>
              Open the camera, scan the member's registration QR code, and verify whether they belong to this club.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {showScannerPreview ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
                <div className="relative aspect-[4/3] w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 border-[18px] border-slate-950/45" />
                  <div className="pointer-events-none absolute inset-x-10 top-1/2 h-32 -translate-y-1/2 rounded-[22px] border-2 border-white/80 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]" />
                  {isStartingCamera ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
                      <Loader2 className="h-7 w-7 animate-spin text-white" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {scanError ? (
              <div className="flex items-start gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{scanError}</p>
              </div>
            ) : null}

            {scanWarning ? (
              <div className="flex items-start gap-2 rounded-[20px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{scanWarning}</p>
              </div>
            ) : null}

            {isProcessingScan || isFetching ? (
              <div className="flex items-center gap-2 rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>QR detected. Checking the scanned member against this club...</p>
              </div>
            ) : null}

            {scannedMemberUserId && !isFetching ? (
              <Card className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <div className={cn("border-b px-4 py-4", verificationTone.panelClassName)}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm">
                        <VerificationIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <Badge className={cn("border px-2 py-0.5 text-[10px] font-semibold", verificationTone.badgeClassName)}>
                          {verificationTone.badgeLabel}
                        </Badge>
                        <div>
                          <h3 className="text-base font-semibold text-slate-950">
                            {verificationTone.title}
                          </h3>
                          <p className="mt-1 text-sm leading-5 opacity-90">
                            {verificationTone.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {shouldShowIdentityDetails ? (
                    <div className="space-y-3 px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
                          Member name
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {fullName || "Unknown member"}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
                          User ID
                        </p>
                        <p className="mt-2 break-all text-sm font-semibold text-slate-950">
                          {scannedMemberUserId}
                        </p>
                      </div>
                      </div>
                      <Button type="button" onClick={handleGoToMember} className="w-full sm:w-auto">
                        Go to member
                      </Button>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            {!showScannerPreview ? (
              <Button type="button" onClick={handleScanAnotherCode}>
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