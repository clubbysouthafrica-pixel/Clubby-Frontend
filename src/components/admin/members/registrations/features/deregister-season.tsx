import { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, User, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeregisterAllMutation } from "@/mutations/admin/useDeregisterMutation";
import { toast } from "sonner";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  checkDeregistrationEvents,
  checkDeregistrationRegistration,
  checkDeregistrationShop,
} from "@/services/admin/deregistration";

interface ImageProps {
  clubId: string;
}

const PENDING_ORDERS_MESSAGE = "There are still orders that have pending payments. Please consolidate them before de-registering.";
const PENDING_FULFILLMENTS_MESSAGE = "There are still items that have pending fulfillments or refunds. Please resolve them before de-registering.";
const PENDING_EVENT_PAYMENTS_MESSAGE = "There are still pending event registrations with outstanding payments. Please resolve them before de-registering.";
const PENDING_EVENT_CONFIRMATIONS_MESSAGE = "There are still pending event registrations that are not confirmed. Please resolve them before de-registering.";

type SystemCheckStatus = {
  status: "success" | "error" | "loading" | "blocked";
  message: string;
  statusCode?: number;
  type?: "PROCESSING" | "PARTIALLY_DELIVERED" | string;
  eventId?: string;
  paymentStatus?: "Awaiting payment" | "Partially paid" | string;
};

function getFulfillmentFilterValues(message?: string, type?: string) {
  if (message === PENDING_FULFILLMENTS_MESSAGE) {
    return ["PROCESSING", "PARTIALLY_DELIVERED"];
  }

  if (!type) {
    return [];
  }

  const normalizedType = type.trim().toUpperCase().replace(/\s+/g, "_");

  if (normalizedType === "PROCESSING" || normalizedType === "PARTIALLY_DELIVERED") {
    return [normalizedType];
  }

  return [];
}

export default function DeregisterSeasonDialog({ clubId }: ImageProps) {
  const { logout } = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [systemCheckResults, setSystemCheckResults] = useState<{
    shop_status?: SystemCheckStatus;
    registration_status?: SystemCheckStatus;
    event_status?: SystemCheckStatus;
  }>({});

  const { mutate, isPending, isSuccess } = useDeregisterAllMutation();

  const getRequestErrorMessage = (error: unknown) => {
    const errObj = error as Record<string, unknown> | undefined;
    const resp = errObj?.response as Record<string, unknown> | undefined;
    const statusCode = resp?.status as number | undefined;

    if (statusCode === 410) {
      return "You have an outstanding balance with Clubby that needs to be paid before you can start a new season.";
    }

    return (
      ((resp?.data as Record<string, unknown> | undefined)?.message as string | undefined) ??
      String(error ?? "An error occurred")
    );
  };

  const hasPassedSystemCheck =
    systemCheckResults.shop_status?.status === "success" &&
    systemCheckResults.registration_status?.status === "success" &&
    systemCheckResults.event_status?.status === "success";
  const shouldShowOrdersLink =
    systemCheckResults.shop_status?.status === "error" &&
    [PENDING_ORDERS_MESSAGE, PENDING_FULFILLMENTS_MESSAGE].includes(
      systemCheckResults.shop_status.message,
    );
  const shouldShowPendingMembersLink =
    systemCheckResults.registration_status?.statusCode === 211;
  const shouldShowEventRegistrationsLink =
    systemCheckResults.event_status?.statusCode === 211 &&
    [PENDING_EVENT_PAYMENTS_MESSAGE, PENDING_EVENT_CONFIRMATIONS_MESSAGE].includes(
      systemCheckResults.event_status?.message || "",
    ) &&
    Boolean(systemCheckResults.event_status?.eventId);
  const hasFailedSystemCheck =
    systemCheckResults.registration_status?.status === "error" ||
    systemCheckResults.shop_status?.status === "error" ||
    systemCheckResults.shop_status?.status === "blocked" ||
    systemCheckResults.event_status?.status === "error" ||
    systemCheckResults.event_status?.status === "blocked";

  const send = () => {
    mutate(
      { clubId: clubId },
      {
        onSuccess: () => {
          toast.success("Season restart is in progress...");
          logout();
          navigate("/login");
        },
        onError: (error: unknown) => {
          setErrorMessage(getRequestErrorMessage(error));
        },
      },
    );
  };

  const handlePerformSystemCheck = async () => {
    if (!clubId || isCheckingSystem) {
      return;
    }

    setSystemCheckResults({});
    setErrorMessage(null);
    setIsCheckingSystem(true);

    try {
      setSystemCheckResults({
        registration_status: {
          status: "loading",
          message: "Checking registrations...",
        },
        shop_status: {
          status: "loading",
          message: "Waiting for registration check...",
        },
        event_status: {
          status: "loading",
          message: "Waiting for shop check...",
        },
      });

      const registrationResponse = await checkDeregistrationRegistration(clubId);
      const registrationResponseData = registrationResponse.data as
        | { message?: string; type?: string }
        | undefined;

      if (registrationResponse.status !== 200) {
        setSystemCheckResults({
          registration_status: {
            status: "error",
            statusCode: registrationResponse.status,
            message: registrationResponseData?.message || "System check failed",
            type: registrationResponseData?.type,
          },
          shop_status: {
            status: "blocked",
            message: "Could not run because the registration check failed.",
          },
          event_status: {
            status: "blocked",
            message: "Could not run because the registration check failed.",
          },
        });
        return;
      }

      setSystemCheckResults({
        registration_status: {
          status: "success",
          statusCode: registrationResponse.status,
          message: "System check for registrations passed.",
          type: registrationResponseData?.type,
        },
        shop_status: {
          status: "loading",
          message: "Checking shop...",
        },
        event_status: {
          status: "loading",
          message: "Waiting for shop check...",
        },
      });

      const shopResponse = await checkDeregistrationShop(clubId);
      const shopResponseData = shopResponse.data as
        | { message?: string; type?: string }
        | undefined;

      if (shopResponse.status !== 200) {
        setSystemCheckResults({
          registration_status: {
            status: "success",
            statusCode: registrationResponse.status,
            message: "System check for registrations passed.",
            type: registrationResponseData?.type,
          },
          shop_status: {
            status: "error",
            statusCode: shopResponse.status,
            message: shopResponseData?.message || "System check failed",
            type: shopResponseData?.type,
          },
          event_status: {
            status: "blocked",
            message: "Could not run because the shop check failed.",
          },
        });
        return;
      }

      setSystemCheckResults({
        registration_status: {
          status: "success",
          statusCode: registrationResponse.status,
          message: "System check for registrations passed.",
          type: registrationResponseData?.type,
        },
        shop_status: {
          status: "success",
          statusCode: shopResponse.status,
          message: "System check for shop passed.",
          type: shopResponseData?.type,
        },
        event_status: {
          status: "loading",
          message: "Checking event registrations...",
        },
      });

      const eventsResponse = await checkDeregistrationEvents(clubId);
      const eventsResponseData = eventsResponse.data as
        | { message?: string; event_id?: string; status?: string }
        | undefined;

      setSystemCheckResults({
        registration_status: {
          status: "success",
          statusCode: registrationResponse.status,
          message: "System check for registrations passed.",
          type: registrationResponseData?.type,
        },
        shop_status: {
          status: "success",
          statusCode: shopResponse.status,
          message: "System check for shop passed.",
          type: shopResponseData?.type,
        },
        event_status: {
          status: eventsResponse.status === 200 ? "success" : "error",
          statusCode: eventsResponse.status,
          message:
            eventsResponse.status === 200
              ? "System check for event registrations passed."
              : eventsResponseData?.message || "System check failed",
          eventId: eventsResponseData?.event_id,
          paymentStatus: eventsResponseData?.status,
        },
      });
    } catch {
      setSystemCheckResults({
        shop_status: {
          status: "error",
          message: "System check failed",
        },
        registration_status: {
          status: "error",
          message: "System check failed",
        },
        event_status: {
          status: "error",
          message: "System check failed",
        },
      });
    } finally {
      setIsCheckingSystem(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      setConfirmed(false);
      setErrorMessage(null);
      setSystemCheckResults({});
      setIsCheckingSystem(false);
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpenDialog(true)}
            aria-label="Deregister season"
            variant="outline"
          >
            <User />
            Start New Season
          </Button>
        </TooltipTrigger>
        <TooltipContent className="mr-2">
          <p>
            Deregister all members and start a new season (resets club data).
          </p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Start New Club Season</DialogTitle>
          <DialogDescription>
            {errorMessage ? (
              <div className="text-red-600">
                <p>{errorMessage}</p>
                {errorMessage.includes("outstanding balance") && (
                  <button
                    onClick={() => navigate("/billing&usage")}
                    className="mt-3 underline text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Click here to see outstanding balances
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span>
                  This action is intended to prepare the club for a fresh season
                  with new member registrations and updated data.
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        {!errorMessage && (
          <>
            <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">What happens next:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>All members will be placed in the members requiring re registration table</li>
                <li>All members will need to resubmit registrations to join the club again</li>
                <li>All reporting for the current season is set to 0</li>
                <li>The previous season reporting can still be found under the reporting season but is historical</li>
              </ul>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Perform system check</p>
                <p className="mt-1 text-sm text-slate-600">
                  Before starting a new season, all registration, shop, orders, and event registration data needs to be consolidated.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handlePerformSystemCheck}
                disabled={isCheckingSystem}
                className="border-slate-300 bg-white"
              >
                {isCheckingSystem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isCheckingSystem ? "Performing system check..." : "Perform system check"}
              </Button>
              {systemCheckResults.shop_status || systemCheckResults.registration_status ? (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <ul className="divide-y divide-slate-200">
                    {systemCheckResults.registration_status ? (
                      <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        {systemCheckResults.registration_status.status === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : systemCheckResults.registration_status.status === "loading" ? (
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <div className="min-w-0 flex-1 border-l-2 border-slate-200 pl-3">
                          <p className="text-sm font-medium text-slate-900">Registration status</p>
                          <p className={systemCheckResults.registration_status.status === "success" ? "text-sm text-emerald-700" : systemCheckResults.registration_status.status === "loading" ? "text-sm text-slate-600" : "text-sm text-rose-700"}>
                            {systemCheckResults.registration_status.message}
                          </p>
                          {shouldShowPendingMembersLink ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenChange(false);
                                navigate("/manage/member/registrations?tab=pending-members");
                              }}
                              className="mt-2 text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                            >
                              Click here
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ) : null}
                    {systemCheckResults.shop_status ? (
                      <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        {systemCheckResults.shop_status.status === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : systemCheckResults.shop_status.status === "loading" ? (
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
                        ) : systemCheckResults.shop_status.status === "blocked" ? (
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <div className="min-w-0 flex-1 border-l-2 border-slate-200 pl-3">
                          <p className="text-sm font-medium text-slate-900">Shop status</p>
                          <p className={systemCheckResults.shop_status.status === "success" ? "text-sm text-emerald-700" : systemCheckResults.shop_status.status === "loading" ? "text-sm text-slate-600" : systemCheckResults.shop_status.status === "blocked" ? "text-sm text-amber-700" : "text-sm text-rose-700"}>
                            {systemCheckResults.shop_status.message}
                          </p>
                          {shouldShowOrdersLink ? (
                            <button
                              type="button"
                              onClick={() => {
                                const shopMessage = systemCheckResults.shop_status?.message;
                                const fulfillmentTypes = getFulfillmentFilterValues(
                                  shopMessage,
                                  systemCheckResults.shop_status?.type,
                                );
                                const query = new URLSearchParams();

                                if (shopMessage === PENDING_ORDERS_MESSAGE) {
                                  query.set("paymentStatus", "pending");
                                }

                                if (fulfillmentTypes.length) {
                                  query.set("fulfillmentStatus", fulfillmentTypes.join(","));
                                }

                                navigate(`/shop/orders?${query.toString()}`);
                              }}
                              className="mt-2 text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                            >
                              Click here
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ) : null}
                    {systemCheckResults.event_status ? (
                      <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        {systemCheckResults.event_status.status === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : systemCheckResults.event_status.status === "loading" ? (
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
                        ) : systemCheckResults.event_status.status === "blocked" ? (
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <div className="min-w-0 flex-1 border-l-2 border-slate-200 pl-3">
                          <p className="text-sm font-medium text-slate-900">Event registrations status</p>
                          <p className={systemCheckResults.event_status.status === "success" ? "text-sm text-emerald-700" : systemCheckResults.event_status.status === "loading" ? "text-sm text-slate-600" : systemCheckResults.event_status.status === "blocked" ? "text-sm text-amber-700" : "text-sm text-rose-700"}>
                            {systemCheckResults.event_status.message}
                          </p>
                          {shouldShowEventRegistrationsLink ? (
                            <button
                              type="button"
                              onClick={() => {
                                const query = new URLSearchParams();

                                if (systemCheckResults.event_status?.eventId) {
                                  query.set("eventId", systemCheckResults.event_status.eventId);
                                }

                                if (
                                  systemCheckResults.event_status?.paymentStatus === "Awaiting payment" ||
                                  systemCheckResults.event_status?.paymentStatus === "Partially paid"
                                ) {
                                  query.set("paymentStatus", systemCheckResults.event_status.paymentStatus);
                                }

                                handleOpenChange(false);
                                navigate(`/events/registrations?${query.toString()}`);
                              }}
                              className="mt-2 text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                            >
                              Click here
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ) : null}
                  </ul>
                  {hasFailedSystemCheck ? (
                    <p className="mt-3 text-sm font-semibold text-rose-700">System check failed.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {hasPassedSystemCheck ? (
              <>
                <div>
                  <span className="text-red-600">
                    ⚠️ This process is irreversible. Archived data will remain
                    accessible in a read-only format, but current members will
                    lose access and must register again for the new season.
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="consent"
                    onCheckedChange={(checked: boolean) => setConfirmed(!!checked)}
                  />

                  <DialogDescription className="text-black">
                    I understand want to start a new season and deregister all current members.
                  </DialogDescription>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="bg-red-700 hover:bg-red-800 text-white"
                    disabled={!confirmed || isPending || isSuccess}
                    onClick={send}
                  >
                    {isPending ? "loading..." : "Start new season"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
