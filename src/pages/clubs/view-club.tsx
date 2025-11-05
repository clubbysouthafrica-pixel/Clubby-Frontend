import Pager from "@/components/pager.tsx";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Calendar,
  Loader2,
  Mail,
  MapPin,
  CreditCard,
  Building2,
  Hash,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useFetchClub, useFetchClubBankDetails } from "@/queries/clubs";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { useFetchUserTransactions } from "@/queries/transactions";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { MemberRegistration } from "@/components/member/registration/member_registration";
import { useFetchPayFastCheckoutUrlQuery } from "@/queries/payfast";

function epochToJoinedString(epoch: number): string {
  const date = new Date(epoch); // if epoch is in seconds, use new Date(epoch * 1000)
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  const formatted = date.toLocaleDateString("en-US", options);
  return `Joined ${formatted}`;
}

const countryMap: Record<string, string> = {
  ZA: "South Africa",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
};

// Local types for transactions to improve table typing
type TransactionEntry = {
  type: string;
  description: string;
  amount: number;
  payment_type?: string;
};

type Transaction = {
  transaction_id: string;
  type: string;
  outstanding_amount: number;
  status: string;
  lifecycle: Record<string, TransactionEntry>;
};

const usePayFastRedirect = (club_account_id: string) => {
  const { data } = useFetchPayFastCheckoutUrlQuery(club_account_id ?? "");

  const redirect = () => {
    if (data?.payment_url) {
      window.location.href = data.payment_url;
    }
  };

  return { redirect };
};

export default function ViewClubPage() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const [countryName, setCountryName] = useState("");
  const { data, isLoading, isError } = useFetchClub(clubId as string);
  const { data: bankDetails, isLoading: bankDetailsLoading } =
    useFetchClubBankDetails(clubId as string, !!data?.club_member_exists);

  const { redirect } = usePayFastRedirect(data?.club_account_id);

  const { data: transactions, isLoading: isUserTransactionsLoading } =
    useFetchUserTransactions(data?.club_account_id ?? "", data?.user_id ?? "");

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [highlightPayment, setHighlightPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePayHereClick = () => {
    // Navigate to the Payments & Billing tab
    setActiveTab("bank");

    setTimeout(() => {
      const paymentOptionsSection = document.getElementById(
        "payment-options-section"
      );
      if (paymentOptionsSection) {
        paymentOptionsSection.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setHighlightPayment(true);
        setTimeout(() => setHighlightPayment(false), 3000);
      }
    }, 100);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const [coverImage, setCoverImage] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const getImg = async () => {
      try {
        setCoverImage(data?.club_cover_url ?? "");
        setProfileImage(data?.club_profile_url ?? "");
      } catch (error) {
        console.error("Failed to fetch images", error);
      }
    };

    if (data?.country_of_operation) {
      const upperCountryCode = data.country_of_operation.toUpperCase();
      setCountryName(countryMap[upperCountryCode] ?? upperCountryCode);
    }

    if (data) {
      getImg();
    }
  }, [data]);

  if (isLoading || isUserTransactionsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Pager>
      {isError && <p> Something went wrong... </p>}
      {data && !data?.onboarded && (
        <div className="mt-10 flex items-start justify-center min-h-screen">
          <div className="text-center px-4">
            <Label className="w-[700px]">
              The club administrator has not yet completed setting up the club
              account for member registration. For urgent enquiries, please
              contact: {data?.support_email}.
            </Label>
          </div>
        </div>
      )}
      {!isLoading && !isError && data?.onboarded && (
        <div className="container mx-auto px-4">
          <div className="relative">
            <Avatar className="w-full h-28 md:h-28 rounded-lg bg-muted/30 overflow-hidden border-background">
              {coverImage ? (
                <AvatarImage
                  className="w-full h-full object-cover object-center"
                  src={coverImage}
                />
              ) : (
                <AvatarFallback className="rounded font-bold">
                  {data?.club_name || "cover"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:space-x-6 px-4">
              <Avatar className="w-32 h-32 border-4 border-background">
                {profileImage ? (
                  <AvatarImage
                    className="object-cover object-center"
                    src={profileImage}
                  />
                ) : (
                  <AvatarFallback className="font-bold">
                    {data?.club_name?.split(" ").map((i: string) => i[0])}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold">
                  {data?.club_name}
                  <span className="ml-2 text-xs text-muted-foreground font-normal rounded-full">
                    {data?.club_type}
                  </span>
                </h1>
                {data?.description && (
                  <h1 className="text-md">{data.description}</h1>
                )}
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
                {!data?.club_member_exists && (
                  <Button
                    variant="outline"
                    className="shadow-none border-black hover:font-bold"
                    onClick={() => navigate(`/clubs/${clubId}/register`)}
                  >
                    Join
                  </Button>
                )}
                {data.resubmission_required && (
                  <div className="flex flex-row justify-center items-center gap-4 font-bold text-xl">
                    <h1>Status: </h1>
                    <Button
                      variant="outline"
                      className="shadow-none text-red-700 hover:font-bold border border-red-700 hover:text-red-700 hover:border-red-700"
                      onClick={() => navigate(`/clubs/${clubId}/register`)}
                    >
                      Re-registration required
                    </Button>
                  </div>
                )}
                {data?.club_member_exists && !data.resubmission_required && (
                  <div className="flex flex-col justify-center items-center font-bold text-xl">
                    <div className="flex flex-row gap-2">
                      <h1>Membership Status: </h1>
                      <h1
                        className={`shadow-none ${
                          data.registered
                            ? "text-green-700 border-green-700"
                            : "text-orange-700 border-orange-700"
                        }`}
                      >
                        {data.registered ? "Registered" : "Pending"}
                      </h1>
                    </div>
                    {!data.registered && (
                      <div className="flex flex-row gap-2">
                        <h3>
                          Outstanding amount:{" "}
                          {formatAmount(
                            bankDetails?.outstanding_amount,
                            data.currency
                          )}
                        </h3>
                        <Label
                          className="underline cursor-pointer hover:text-red-600"
                          onClick={handlePayHereClick}
                        >
                          (Pay here)
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="justify-start h-10">
                <>
                  <TabsTrigger className="w-[200px]" value="home">
                    Home
                  </TabsTrigger>
                  {(data?.club_member_exists ||
                    data?.resubmission_required) && (
                    <>
                      <TabsTrigger className="w-[200px]" value="bank">
                        Payments & Billing
                      </TabsTrigger>
                    </>
                  )}
                  {(data?.club_member_exists ||
                    data?.resubmission_required) && (
                    <>
                      <TabsTrigger
                        className="w-[200px]"
                        value="member-registration"
                      >
                        Registration
                      </TabsTrigger>
                    </>
                  )}
                </>
              </TabsList>

              <TabsContent value="member-registration">
                <MemberRegistration
                  membershipStatus={
                    data.resubmission_required
                      ? "Resubmission required"
                      : data.registered
                      ? "Registered"
                      : "Pending"
                  }
                  clubName={data.club_name}
                  currency={data.currency}
                  clubAccountId={data.club_account_id}
                />
              </TabsContent>

              <TabsContent value="home">
                <div>
                  <Card className="md:col-span-2 gap-4">
                    <CardHeader>
                      <CardTitle>{data.club_name}</CardTitle>
                      <CardDescription>
                        {data?.description ?? "This is the clubs home page."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{data.support_email}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{countryName}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{epochToJoinedString(data.joined)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {data?.club_member_exists && (
                <TabsContent value="bank">
                  <Card className="w-full text-xl border-none shadow-none mb-4">
                    <CardTitle>
                      Outstanding amount:{" "}
                      {formatAmount(
                        bankDetails?.outstanding_amount,
                        data.currency
                      )}
                      <p className="text-[1rem] text-gray-500 mt-2 font-normal">
                        Payment Reference Number:{" "}
                        {bankDetails?.registration_payment_reference}
                      </p>
                      </CardTitle>
                      </Card>
                      <div className="flex flex-col w-full gap-6">
                        <Card
                          id="payment-options-section"
                          className={`transition-all duration-300 ${
                            highlightPayment ? "ring-2 ring-red-300 shadow-lg" : ""
                          }`}
                        >
                          <CardHeader className="px-6 pb-2">
                            <CardTitle>Payment Options</CardTitle>
                            <CardDescription>
                              Choose your preferred payment method to settle your outstanding balance. The club supports the following payment options:
                            </CardDescription>
                          </CardHeader>
                          <Tabs defaultValue="eft" className="px-6 pb-6">
                            <TabsList className={`grid w-full ${data?.payfast_enabled && data?.club_member_exists ? "grid-cols-2" : "grid-cols-1"}`}>
                              <TabsTrigger value="eft">Bank Transfer (EFT)</TabsTrigger>
                              {data?.payfast_enabled && data?.club_member_exists && (
                                <TabsTrigger value="online">
                                  Online Payment
                                </TabsTrigger>
                              )}
                            </TabsList>
                            <TabsContent value="eft" className="pt-2">
                              <div className="px-6 py-4 space-y-6">
                                <div className="text-center space-y-2">
                                  <h3 className="text-lg font-semibold">
                                    Bank Transfer (EFT)
                                  </h3>
                                  <CardDescription>
                                    Transfer funds directly to the club's bank account using the details below.
                                    <br />
                                    <strong className="text-foreground">
                                      Important:
                                    </strong>{" "}
                                    Always include your payment reference number to ensure proper allocation of your payment.
                                  </CardDescription>
                                </div>

                                {bankDetailsLoading && (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                            )}

                            {!bankDetailsLoading && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group">
                                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Building2 className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Bank
                                        </p>
                                        <p className="font-semibold">
                                          {bankDetails?.bank}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(
                                          bankDetails?.bank || "",
                                          "bank"
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {copiedField === "bank" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div className="relative group">
                                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Hash className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Account Number
                                        </p>
                                        <p className="font-semibold font-mono">
                                          {bankDetails?.account_number}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(
                                          bankDetails?.account_number || "",
                                          "account"
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {copiedField === "account" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <div className="relative group">
                                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Hash className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Branch Code
                                        </p>
                                        <p className="font-semibold font-mono">
                                          {bankDetails?.branch_code}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(
                                          bankDetails?.branch_code || "",
                                          "branch"
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {copiedField === "branch" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Account Type */}
                                <div className="relative group">
                                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Building2 className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Account Type
                                        </p>
                                        <p className="font-semibold">
                                          {bankDetails?.account_type}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(
                                          bankDetails?.account_type || "",
                                          "type"
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {copiedField === "type" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Payment Reference */}
                                {bankDetails?.payment_reference && (
                                  <div className="relative group sm:col-span-2">
                                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg transition-colors">
                                      <div className="flex items-center gap-3 flex-1">
                                        <Hash className="h-5 w-5 text-primary" />
                                        <div>
                                          <p className="text-xs text-muted-foreground">
                                            Payment Reference (Important!)
                                          </p>
                                          <p className="font-bold font-mono text-primary">
                                            {bankDetails?.payment_reference}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          copyToClipboard(
                                            bankDetails?.payment_reference ||
                                              "",
                                            "reference"
                                          )
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        {copiedField === "reference" ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="online" className="px-6 py-8">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="text-center space-y-2">
                              <h3 className="text-lg font-semibold">
                                Pay Online with PayFast
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Securely pay your outstanding amount using
                                credit card, debit card, or instant EFT
                              </p>
                            </div>
                            <Button
                              onClick={redirect}
                              disabled={bankDetails?.outstanding_amount === 0}
                              size="lg"
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <CreditCard className="mr-2 h-5 w-5" />
                              Pay with PayFast
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              You will be redirected to PayFast's secure payment
                              gateway
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </Card>
                    {!isUserTransactionsLoading && transactions && (
                      <Card className="border-none shadow-none gap-2">
                        <CardHeader className="px-6">
                          <CardTitle>Transactions</CardTitle>
                          <CardDescription>
                            View your transactions with this club.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-6 pt-2 pb-6 max-h-[520px] overflow-y-auto">
                          <div className="overflow-hidden rounded-lg">
                            <Table className="border">
                              <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="text-center w-1/4">
                                    Transaction ID
                                  </TableHead>
                                  <TableHead className="text-center w-1/4">
                                    Type
                                  </TableHead>
                                  <TableHead className="text-center w-1/4">
                                    Outstanding amount
                                  </TableHead>
                                  <TableHead className="text-center w-1/4">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {transactions.transactions.length === 0 && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={4}
                                      className="text-center py-8 text-muted-foreground"
                                    >
                                      No transactions yet.
                                    </TableCell>
                                  </TableRow>
                                )}
                                {transactions.transactions.map(
                                  (tx: Transaction) => (
                                    <React.Fragment key={tx.transaction_id}>
                                      {/* Main Transaction Row */}
                                      <TableRow
                                        className="cursor-pointer hover:bg-muted/50 transition odd:bg-muted/20"
                                        onClick={() =>
                                          toggleRow(tx.transaction_id)
                                        }
                                      >
                                        <TableCell className="text-center w-1/4">
                                          <div className="inline-flex items-center gap-2 justify-center">
                                            <span className="font-mono">
                                              {tx.transaction_id.slice(0, 5)}...
                                            </span>

                                            {/* Copy button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation(); // Prevent triggering row expand
                                                navigator.clipboard.writeText(
                                                  tx.transaction_id
                                                );
                                              }}
                                              title="Click to copy full Transaction ID"
                                              className="hover:text-primary"
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-muted-foreground hover:text-foreground transition"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                                                />
                                              </svg>
                                            </button>

                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className={`h-4 w-4 transition-transform ${
                                                expandedRows[tx.transaction_id]
                                                  ? "rotate-90"
                                                  : ""
                                              }`}
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                              />
                                            </svg>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {tx.type}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {formatAmount(
                                            tx.outstanding_amount,
                                            data.currency
                                          )}
                                        </TableCell>
                                        <TableCell
                                          className={`text-center font-bold ${
                                            tx.status === "PENDING"
                                              ? "text-red-500"
                                              : tx.status === "PARTIALLY PAID"
                                              ? "text-orange-500"
                                              : "text-green-500"
                                          }`}
                                        >
                                          {tx.status}
                                        </TableCell>
                                      </TableRow>

                                      {expandedRows[tx.transaction_id] && (
                                        <TableRow className="bg-muted/10">
                                          <TableCell
                                            colSpan={8}
                                            className="p-4"
                                          >
                                            <div className="overflow-hidden rounded-lg">
                                              <Table className="w-full">
                                                <TableHeader className="bg-muted sticky top-0 z-10">
                                                  <TableRow>
                                                    <TableHead className="text-center">
                                                      Date
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                      Type
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                      Description
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                      Amount
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                      Payment type
                                                    </TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {Object.entries(
                                                    tx.lifecycle as Record<
                                                      string,
                                                      TransactionEntry
                                                    >
                                                  )
                                                    // Sort by timestamp descending (latest first)
                                                    .sort(
                                                      ([a], [b]) =>
                                                        Number(b) - Number(a)
                                                    )
                                                    .map(
                                                      ([timestamp, entry]: [
                                                        string,
                                                        TransactionEntry
                                                      ]) => (
                                                        <TableRow
                                                          key={timestamp}
                                                        >
                                                          <TableCell className="text-center">
                                                            {new Date(
                                                              Number(timestamp)
                                                            ).toLocaleString(
                                                              "en-GB",
                                                              {
                                                                day: "2-digit",
                                                                month:
                                                                  "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                                hour12: true,
                                                              }
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {entry.type}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {entry.description}
                                                          </TableCell>
                                                          <TableCell
                                                            className={`text-center ${
                                                              entry.type ===
                                                              "SUBMISSION"
                                                                ? "text-red-500"
                                                                : "text-green-500"
                                                            } font-bold`}
                                                          >
                                                            {entry.type ===
                                                            "SUBMISSION"
                                                              ? "-"
                                                              : "+"}
                                                            {formatAmount(
                                                              entry.amount,
                                                              data.currency
                                                            )}
                                                          </TableCell>
                                                          <TableCell className="text-center">
                                                            {entry.payment_type ??
                                                              "N/A"}
                                                          </TableCell>
                                                        </TableRow>
                                                      )
                                                    )}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      )}
    </Pager>
  );
}
