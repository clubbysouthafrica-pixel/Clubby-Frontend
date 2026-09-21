import { AppSidebar } from "@/components/app-sidebar";
import { AdminTopNav } from "@/components/admin/top-nav";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ClubProvider, {
  ClubAccountBalanceEntry,
  ClubContext,
  Club,
  ClubContextType,
} from "@/context/ClubContext";
import { formatAmount } from "@/data/currencies";
import { AlertTriangle, AlertCircle, CreditCard, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFetchAdminClubs, useFetchClub } from "@/queries/admin/clubs";

const BILLING_AND_USAGE_PATH = "/billing&usage";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { club, setClub, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [isBannerClosed, setIsBannerClosed] = useState(false);
  const clubAccountId = club?.club_account_id ?? "";
  const { data: adminClubsResponse } = useFetchAdminClubs();
  const { data: fetchedClub, isLoading: fetchedClubLoading } = useFetchClub(
    clubAccountId,
    {
      includeAccountBalance: true,
    },
  );
  const adminClubItems = adminClubsResponse?.data?.items ?? [];
  const activeAdminClub = adminClubItems.find(
    (item: { club_account_id?: string }) => item.club_account_id === clubAccountId,
  );
  const currentClub = useMemo(
    () =>
      ({
        ...club,
        ...activeAdminClub,
        ...fetchedClub,
        access: activeAdminClub?.access ?? club?.access,
      }) as Club | null,
    [activeAdminClub, fetchedClub, club],
  );
  const outstandingAccountBalanceEntries = useMemo(
    () =>
      (currentClub?.account_balance_entries ?? []) as ClubAccountBalanceEntry[],
    [currentClub?.account_balance_entries],
  );
  const totalOutstandingAccountBalance = useMemo(
    () =>
      outstandingAccountBalanceEntries.reduce(
        (total: number, entry: ClubAccountBalanceEntry) =>
          total + (entry.outstanding_amount ?? 0),
        0,
      ),
    [outstandingAccountBalanceEntries],
  );
  const outstandingBalanceMonthsLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    return outstandingAccountBalanceEntries
      .map(({ month_date }: ClubAccountBalanceEntry) => {
        const parsedDate = new Date(`${month_date}-01T00:00:00Z`);
        if (Number.isNaN(parsedDate.getTime())) {
          return month_date;
        }
        return formatter.format(parsedDate);
      })
      .join(", ");
  }, [outstandingAccountBalanceEntries]);

  // Check if club setup is incomplete
  const isClubIncomplete =
    currentClub &&
    (currentClub.registration_form_exists === false ||
      currentClub.currency_exists === false ||
      currentClub.country_exists === false ||
      currentClub.bank_details_exists === false);

  useEffect(() => {
    if (fetchedClub && club) {
      const nextClub = {
        ...club,
        ...activeAdminClub,
        ...fetchedClub,
        access: activeAdminClub?.access ?? club.access,
      };

      if (JSON.stringify(nextClub) !== JSON.stringify(club)) {
        setClub(nextClub);
      }
    }
  }, [activeAdminClub, fetchedClub, club, setClub]);

  const isOnBillingAndUsagePage = location.pathname === BILLING_AND_USAGE_PATH;
  const needsPayfastCard = currentClub?.payfast_token !== true;

  const shouldShowOutstandingBalanceDialog =
    !clubLoading &&
    !fetchedClubLoading &&
    !!clubAccountId &&
    !isOnBillingAndUsagePage &&
    outstandingAccountBalanceEntries.length > 0 &&
    needsPayfastCard;

  const handleBillingNavigation = () => {
    navigate(BILLING_AND_USAGE_PATH);
  };

  return (
    <>
      <Dialog open={shouldShowOutstandingBalanceDialog}>
        <DialogContent
          className="sm:max-w-xl border-amber-200 bg-white"
          showCloseButton={false}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader className="space-y-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CreditCard className="h-6 w-6" />
            </div>
            <DialogTitle>Add a card to continue using Clubby</DialogTitle>
            <DialogDescription className="space-y-3 text-slate-600">
              <p>
                There {outstandingAccountBalanceEntries.length === 1 ? "is" : "are"} unpaid
                account balance {outstandingAccountBalanceEntries.length === 1 ? "entry" : "entries"}
                {outstandingBalanceMonthsLabel ? ` for ${outstandingBalanceMonthsLabel}` : ""}, and no card is on
                file for your club.
              </p>
              <p>
                Add your card details in Billing &amp; Usage so Clubby can automatically charge
                outstanding and future balances.
              </p>
              <p className="font-medium text-slate-950">
                Total outstanding: {formatAmount(totalOutstandingAccountBalance, currentClub?.currency)}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleBillingNavigation}
            >
              Add Card Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isClubIncomplete && !isBannerClosed && (
        <div className="fixed top-0 left-0 right-0 z-50 w-full bg-orange-50 border-b-4 border-orange-400 p-4">
          <div className="flex w-full gap-3 items-start pr-12">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-orange-800 flex-1 whitespace-normal">
              Your club setup is incomplete. Please complete the following to
              make your club visible to members:{" "}
              {!currentClub.registration_form_exists && (
                <>
                  <Link
                    to="/manage/registrations/forms?missing=registration_form"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Registration Form
                  </Link>
                  ,{" "}
                </>
              )}
              {!currentClub.country_exists && (
                <>
                  <Link
                    to="/manage/club?missing=country"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Country
                  </Link>
                  ,{" "}
                </>
              )}
              {!currentClub.currency_exists && (
                <>
                  <Link
                    to="/manage/club?missing=currency"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Currency
                  </Link>
                  ,{" "}
                </>
              )}
              {!currentClub.bank_details_exists && (
                <Link
                  to="/manage/club?missing=bank_details"
                  className="underline font-semibold hover:text-orange-900"
                >
                  Bank Details
                </Link>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsBannerClosed(true)}
            className="absolute top-4 right-4 text-orange-600 hover:text-orange-800 transition-colors"
            aria-label="Close banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className={`flex flex-col min-h-screen`}>
        <div className={`flex-1 ${isClubIncomplete && !isBannerClosed ? "" : ""}`}>
        <SidebarProvider>
          {/* Fixed full-width top nav — rendered inside SidebarProvider so SidebarTrigger works */}
          <AdminTopNav />
          <AppSidebar />
          <SidebarInset
            className={[
              "flex h-screen flex-col overflow-hidden",
              currentClub?.deregistration_in_progress
                ? "pointer-events-none opacity-50"
                : "",
            ].join(" ")}
          >
            {currentClub?.deregistration_in_progress && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-auto">
                <Alert
                  variant="destructive"
                  className="w-full max-w-2xl mx-4 border-2 border-red-600 shadow-2xl"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <AlertDescription className="ml-2 text-lg">
                    This club is currently undergoing deregistration and cannot
                    be interacted with. Please contact support for assistance if
                    this message persists longer than 10 minutes.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {/* Spacer so content starts below the fixed top nav */}
            <div className="h-[100px] shrink-0" />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClubProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ClubProvider>
  );
}
