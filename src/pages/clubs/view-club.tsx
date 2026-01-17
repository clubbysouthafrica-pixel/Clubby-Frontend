// fixed erroneous import from prior patch
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Building2,
  Hash,
  Copy,
  CheckCircle2,
  ExternalLink,
  Users,
  Shield,
  CreditCard,
  FileText,
  Home,
  AlertTriangle,
  Clock,
  CheckCircle,
  Globe,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";
import { useFetchUserTransactions } from "@/queries/transactions";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MemberRegistration } from "@/components/member/current_registration/current_member_registration";
import { PayFastPayment } from "@/components/payments/payfast-payment";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { updatePaymentReferenceService } from "@/services/profile";
import { toast } from "sonner";

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

export default function ViewClubPage() {
  const auth = useContext(AuthContext);
  const isLoggedIn = !!auth?.user;
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const { clubId } = useParams();
  const [countryName, setCountryName] = useState("");
  const { data, isLoading, isError } = useFetchClub(clubId as string);
  const { data: bankDetails, isLoading: bankDetailsLoading } =
    useFetchClubBankDetails(clubId as string, !!data?.club_member_exists);
  const { data: transactions, isLoading: isUserTransactionsLoading } =
    useFetchUserTransactions(data?.club_account_id ?? "", data?.user_id ?? "");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("home");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [editingReference, setEditingReference] = useState(false);
  const [newReference, setNewReference] = useState(
    bankDetails?.registration_payment_reference || ""
  );
  const [savingReference, setSavingReference] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePayHereClick = () => {
    if (!bankDetailsLoading && bankDetails) {
      setPaymentDialogOpen(true);
    } else {
      toast.error("Payment details are still loading. Please wait...");
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveReference = async () => {
    setSavingReference(true);
    try {
      await updatePaymentReferenceService(
        data?.club_account_id ?? "",
        newReference
      );
      // Update the local bankDetails state
      if (bankDetails) {
        bankDetails.registration_payment_reference = newReference;
      }
      setEditingReference(false);
      toast.success("Payment reference updated successfully");
    } catch (error) {
      console.error("Failed to update payment reference:", error);
      toast.error("Failed to update payment reference");
      // Reset to original value on error
      setNewReference(bankDetails?.registration_payment_reference || "");
    } finally {
      setSavingReference(false);
    }
  };

  const handleCancelEdit = () => {
    setNewReference(bankDetails?.registration_payment_reference || "");
    setEditingReference(false);
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

  useEffect(() => {
    setNewReference(bankDetails?.registration_payment_reference || "");
  }, [bankDetails?.registration_payment_reference]);

  const getStatusIcon = (
    isRegistered: boolean,
    resubmissionRequired: boolean
  ) => {
    if (resubmissionRequired) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return isRegistered ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-orange-600" />
    );
  };

  const getStatusColor = (
    isRegistered: boolean,
    resubmissionRequired: boolean
  ) => {
    if (resubmissionRequired) {
      return "text-red-600";
    }
    return isRegistered ? "text-green-600" : "text-orange-600";
  };

  const getStatusTitle = (
    isRegistered: boolean,
    resubmissionRequired: boolean
  ) => {
    if (resubmissionRequired) {
      return "Resubmission Required";
    }
    return isRegistered ? "Registration Confirmed" : "Registration Pending";
  };

  const getStatusDescription = (
    isRegistered: boolean,
    resubmissionRequired: boolean
  ) => {
    if (resubmissionRequired) {
      return "Your registration requires a resubmission. This may be due to reasons such as your membership expiring, the club starting a new season, or invalid information in your previous submission. Please resubmit your registration form.";
    }
    if (isRegistered) {
      return `Your registration has been successfully accepted, and your payment has been confirmed by the admin. You are now officially a member of ${data?.club_name}.`;
    }
    return "Your registration is currently pending. The club admin still needs to verify your submitted registration and confirm if your registration fee has been paid. If you haven't paid yet, please visit Payments & Billing to complete the outstanding payment using a supported method.";
  };

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
      {!isLoading && data && !data?.onboarded && (
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
      {!isLoading && data && data?.deregistration_in_progress === true && (
        <div className="mt-10 flex items-start justify-center min-h-screen">
          <div className="text-center px-4">
            <div className="text-center space-y-4">
              <Label className="w-[700px]">
                This club is currently undergoing deregistration and cannot
                accept new members or process member interactions at this time.
                Please check back once the deregistration process is complete.
              </Label>
            </div>
          </div>
        </div>
      )}
      {!isLoading &&
        !isError &&
        data?.onboarded &&
        data?.deregistration_in_progress !== true && (
          <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
            {/* Hero Section */}
            <div className="relative">
              {/* Cover Image with Gradient Overlay */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                {coverImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={coverImage}
                      alt={`${data?.club_name} cover`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted/20 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Users className="w-16 h-16 text-primary/50 mx-auto" />
                      <p className="text-lg text-muted-foreground font-medium">
                        {data?.club_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="container mx-auto px-4 relative -mt-20">
                <Card className="backdrop-blur-sm bg-background/95 border-primary/20 shadow-2xl gap-0">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                          {profileImage ? (
                            <AvatarImage
                              className="object-cover object-center"
                              src={profileImage}
                            />
                          ) : (
                            <AvatarFallback className="font-bold text-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                              {data?.club_name
                                ?.split(" ")
                                .map((i: string) => i[0])}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Shield className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>

                      {/* Club Details */}
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              {data?.club_name}
                            </h1>
                            <Badge variant="secondary" className="text-xs">
                              {data?.club_type}
                            </Badge>
                          </div>
                          {data?.description && (
                            <p className="text-lg text-muted-foreground leading-relaxed">
                              {data.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{countryName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{epochToJoinedString(data.joined)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{data.support_email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 min-w-fit">
                        {data?.club_member_exists && (
                          <div className="text-center">
                            {!data.resubmission_required && (
                              <div className="flex items-center justify-center gap-2 mb-2">
                                {data.registered ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-orange-600" />
                                )}
                                <Badge
                                  variant={
                                    data.registered ? "default" : "secondary"
                                  }
                                  className={cn(
                                    "text-sm",
                                    data.registered
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-orange-100 text-orange-800 border-orange-200"
                                  )}
                                >
                                  {data.registered
                                    ? "Active Member"
                                    : "Pending Member"}
                                </Badge>
                              </div>
                            )}
                            {!data.registered &&
                              !data.resubmission_required &&
                              bankDetails?.outstanding_amount > 0 && (
                                <div className="text-center space-y-1">
                                  <p className="text-sm text-muted-foreground">
                                    Outstanding:{" "}
                                    {formatAmount(
                                      bankDetails.outstanding_amount,
                                      data.currency
                                    )}
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handlePayHereClick}
                                    className="text-xs h-auto p-0 text-destructive hover:text-destructive/80"
                                  >
                                    Pay Now
                                  </Button>
                                </div>
                              )}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {!data?.club_member_exists && isLoggedIn && (
                            <Button
                              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() =>
                                navigate(`/clubs/${clubId}/register`)
                              }
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Join Club
                            </Button>
                          )}
                          {!data?.club_member_exists && !isLoggedIn && (
                            <Button
                              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() =>
                                navigate(`/clubs/${clubId}/public/register`)
                              }
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Join Club
                            </Button>
                          )}
                          {data.resubmission_required && (
                            <Button
                              variant="destructive"
                              className="shadow-lg hover:shadow-xl transition-all duration-300"
                              onClick={() =>
                                navigate(`/clubs/${clubId}/register`)
                              }
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Re-registration Required
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  {data?.club_member_exists && (
                    <CardHeader className="pb-0 border-t border-primary/10 space-y-3 pt-4">
                      <div className="flex items-center gap-2 mb-0">
                        {getStatusIcon(
                          data.registered,
                          data.resubmission_required
                        )}
                        <h3
                          className={`text-sm font-semibold ${getStatusColor(
                            data.registered,
                            data.resubmission_required
                          )}`}
                        >
                          {getStatusTitle(
                            data.registered,
                            data.resubmission_required
                          )}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {getStatusDescription(
                          data.registered,
                          data.resubmission_required
                        )}
                      </p>
                    </CardHeader>
                  )}
                </Card>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 mt-8 mb-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value);
                  if (value === "home" && data?.club_url) {
                    setIframeLoading(true);
                  }
                }}
              >
                <TabsList
                  className={cn(
                    "bg-background/50 backdrop-blur-sm border border-primary/20 shadow-lg",
                    isMobile
                      ? "flex flex-col h-auto w-full gap-1 p-1"
                      : "justify-start h-12"
                  )}
                >
                  <TabsTrigger
                    className={cn(
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
                      isMobile
                        ? "w-full justify-center text-sm h-10"
                        : "w-[200px] h-10"
                    )}
                    value="home"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </TabsTrigger>
                  {(data?.club_member_exists ||
                    data?.resubmission_required) && (
                    <TabsTrigger
                      className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
                        isMobile
                          ? "w-full justify-center text-sm h-10"
                          : "w-[200px] h-10"
                      )}
                      value="bank"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isMobile ? "Payments" : "Payments & Billing"}
                    </TabsTrigger>
                  )}
                  {(data?.club_member_exists ||
                    data?.resubmission_required) && (
                    <TabsTrigger
                      className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
                        isMobile
                          ? "w-full justify-center text-sm h-10"
                          : "w-[200px] h-10"
                      )}
                      value="member-registration"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Registration
                    </TabsTrigger>
                  )}
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

                <TabsContent value="home" className="mt-6">
                  <div className="space-y-6">
                    {data?.club_url ? (
                      <Card className="border-primary/20 shadow-lg overflow-hidden">
                        <div className="relative group w-full overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-primary/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-primary" />
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    Club Website
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Interactive club content
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(data.club_url!, "_blank")
                                }
                                className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Full Site
                              </Button>
                            </div>
                          </div>
                          <div
                            className="relative w-full bg-background"
                            style={{ height: "70vh" }}
                          >
                            {iframeLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            )}
                            <iframe
                              src={data.club_url}
                              title="Club Website"
                              className="w-full border-0 bg-background"
                              style={{ height: "100%" }}
                              onLoad={() => setIframeLoading(false)}
                            />
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Welcome Card */}
                        {/* <Card className="border-primary/20 shadow-lg">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">
                                  Welcome to {data.club_name}
                                </CardTitle>
                                <CardDescription className="text-base">
                                  {data?.description ??
                                    "Discover what this amazing club has to offer."}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card> */}

                        {/* Contact Information Card */}
                        <Card className="border-primary/20 shadow-lg">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Mail className="w-5 h-5 text-primary" />
                              Contact Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <Mail className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Support Email
                                </p>
                                <p className="font-medium">
                                  {data.support_email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <MapPin className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Location
                                </p>
                                <p className="font-medium">{countryName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Established
                                </p>
                                <p className="font-medium">
                                  {epochToJoinedString(data.joined)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {data?.club_member_exists && (
                  <TabsContent value="bank" className="mt-6">
                    {!data?.resubmission_required && (
                      <Card className="border-primary/20 shadow-lg mb-6">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-2xl">
                                Outstanding Balance
                              </CardTitle>
                              <CardDescription className="text-lg">
                                {formatAmount(
                                  bankDetails?.outstanding_amount,
                                  data.currency
                                )}
                              </CardDescription>
                            </div>
                            {bankDetails?.outstanding_amount === 0 && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Paid in Full
                              </Badge>
                            )}
                            {bankDetails?.outstanding_amount > 0 && (
                              <Button
                                onClick={handlePayHereClick}
                                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                Pay Now
                              </Button>
                            )}
                          </div>
                          {bankDetails?.registration_payment_reference && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-muted-foreground">
                                  Payment Reference Number
                                </p>
                                {!editingReference && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingReference(true)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>

                              {!editingReference ? (
                                <>
                                  <p className="font-mono font-semibold">
                                    {bankDetails.registration_payment_reference}
                                  </p>
                                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                                    This reference number is displayed on the
                                    admin side. When you make a payment (e.g.,
                                    via EFT), include this number as your proof
                                    of reference so the admin can verify and
                                    match your payment to your account.
                                  </p>
                                </>
                              ) : (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor="reference-input"
                                      className="text-xs"
                                    >
                                      New Reference Number
                                    </Label>
                                    <Input
                                      id="reference-input"
                                      value={newReference}
                                      onChange={(e) =>
                                        setNewReference(e.target.value)
                                      }
                                      placeholder="Enter new reference number"
                                      className="font-mono"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveReference}
                                      disabled={
                                        savingReference || !newReference.trim()
                                      }
                                      className="flex-1"
                                    >
                                      {savingReference && (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      )}
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      disabled={savingReference}
                                      className="flex-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardHeader>
                      </Card>
                    )}
                    <div className="flex flex-col w-full gap-6">
                      {!isUserTransactionsLoading && transactions && (
                        <Card className="border-primary/20 shadow-lg">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl">
                                  Transaction History
                                </CardTitle>
                                <CardDescription className="text-base">
                                  View your payment transactions and membership
                                  activity
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-hidden">
                              <Table className="border-0">
                                <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 sticky top-0 z-10">
                                  <TableRow className="border-primary/10 hover:bg-transparent">
                                    <TableHead className="text-center w-1/4 font-semibold">
                                      Transaction ID
                                    </TableHead>
                                    <TableHead className="text-center w-1/4 font-semibold">
                                      Type
                                    </TableHead>
                                    <TableHead className="text-center w-1/4 font-semibold">
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
                                          className="cursor-pointer hover:bg-primary/5 transition-colors border-primary/10 group"
                                          onClick={() =>
                                            toggleRow(tx.transaction_id)
                                          }
                                        >
                                          <TableCell className="text-center w-1/4 py-4">
                                            <div className="inline-flex items-center gap-3 justify-center">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary/50" />
                                                <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                                  {tx.transaction_id.slice(
                                                    0,
                                                    8
                                                  )}
                                                  ...
                                                </span>
                                              </div>

                                              {/* Copy button */}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(
                                                    tx.transaction_id
                                                  );
                                                }}
                                                title="Copy full Transaction ID"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>

                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-4 w-4 transition-transform text-muted-foreground ${
                                                  expandedRows[
                                                    tx.transaction_id
                                                  ]
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
                                          <TableCell className="text-center py-4">
                                            <Badge
                                              variant="outline"
                                              className="font-medium"
                                            >
                                              {tx.type}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center py-4">
                                            <Badge
                                              className={cn(
                                                "font-medium",
                                                tx.status === "PENDING"
                                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                                  : tx.status ===
                                                    "PARTIALLY PAID"
                                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                                  : tx.status === "REFUND"
                                                  ? "bg-red-100 text-red-800 border-red-200"
                                                  : tx.status === "CANCELLED"
                                                  ? "bg-red-100 text-red-800 border-red-200"
                                                  : "bg-green-100 text-green-800 border-green-200"
                                              )}
                                            >
                                              {tx.status}
                                            </Badge>
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
                                                                Number(
                                                                  timestamp
                                                                )
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
                                                              {
                                                                entry.description
                                                              }
                                                            </TableCell>
                                                            <TableCell
                                                              className={`text-center ${
                                                                entry.type ===
                                                                "SUBMISSION"
                                                                  ? "text-black-700"
                                                                  : entry.type ===
                                                                    "REFUND"
                                                                  ? "text-red-700"
                                                                  : entry.type ===
                                                                    "CANCELLATION"
                                                                  ? "text-red-700"
                                                                  : "text-green-700"
                                                              }`}
                                                            >
                                                              {entry.type ===
                                                              "SUBMISSION"
                                                                ? ""
                                                                : entry.type === "REFUND"
                                                                ? "-"
                                                                : entry.type === "CANCELLATION"
                                                                ? "N/A"
                                                                : "+"}
                                                              {entry.type !== "CANCELLATION" && formatAmount(
                                                                entry.type === "REFUND" ? Math.abs(entry.amount) : entry.amount,
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

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="!w-[1000px] !h-[800px] !max-w-none !max-h-none p-5 gap-4 flex flex-col min-h-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6 text-primary" />
              Payment Options
            </DialogTitle>
            <div className="space-y-1">
              <DialogDescription className="text-base">
                Outstanding Balance:{" "}
                <span className="font-semibold text-foreground">
                  {formatAmount(
                    bankDetails?.outstanding_amount,
                    data?.currency
                  )}
                </span>
              </DialogDescription>
              {bankDetails?.registration_payment_reference && (
                <DialogDescription className="text-base">
                  Payment Reference:{" "}
                  <span className="font-semibold text-foreground">
                    {bankDetails?.registration_payment_reference}
                  </span>
                </DialogDescription>
              )}
            </div>
          </DialogHeader>
          <Tabs
            defaultValue="eft"
            className="w-full flex flex-col flex-1 overflow-hidden px-6"
          >
            <TabsList
              className={`grid w-full flex-shrink-0 ${(() => {
                let cols = 1;
                if (
                  data?.payfast_enabled &&
                  data?.club_member_exists &&
                  (bankDetails?.outstanding_amount ?? 0) > 0
                ) {
                  cols++;
                }
                if (
                  data?.custom_payment_methods &&
                  data.custom_payment_methods.length > 0
                ) {
                  cols += data.custom_payment_methods.length;
                }
                return `grid-cols-${cols}`;
              })()}`}
            >
              <TabsTrigger value="eft">Bank Transfer (EFT)</TabsTrigger>
              {data?.payfast_enabled &&
                data?.club_member_exists &&
                (bankDetails?.outstanding_amount ?? 0) > 0 && (
                  <TabsTrigger value="online">Online Payment</TabsTrigger>
                )}
              {data?.custom_payment_methods &&
                data.custom_payment_methods.map(
                  (method: any, index: number) => (
                    <TabsTrigger key={index} value={`custom-${index}`}>
                      {method.name}
                    </TabsTrigger>
                  )
                )}
            </TabsList>
            <TabsContent value="eft" className="pt-4 flex-1 overflow-y-auto">
              <div className="space-y-3 sm:space-y-6 pr-2 sm:pr-4">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    <h3 className="text-sm sm:text-xl font-semibold">
                      Bank Transfer (EFT)
                    </h3>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Transfer funds directly to the club's bank account using
                      the details below.
                    </p>
                  </div>
                </div>

                {bankDetailsLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {!bankDetailsLoading && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-6 max-w-2xl w-full">
                      <Card className="group hover:shadow-md transition-shadow border-primary/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                  Bank Name
                                </p>
                                <p className="font-semibold text-lg">
                                  {bankDetails?.bank}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(bankDetails?.bank || "", "bank")
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
                        </CardContent>
                      </Card>
                      <Card className="group hover:shadow-md transition-shadow border-primary/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Hash className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                  Account Number
                                </p>
                                <p className="font-semibold font-mono text-lg">
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
                        </CardContent>
                      </Card>

                      <Card className="group hover:shadow-md transition-shadow border-primary/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Hash className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                  Branch Code
                                </p>
                                <p className="font-semibold font-mono text-lg">
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
                        </CardContent>
                      </Card>

                      <Card className="group hover:shadow-md transition-shadow border-primary/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                  Account Type
                                </p>
                                <p className="font-semibold text-lg">
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
                        </CardContent>
                      </Card>

                      {bankDetails?.payment_reference && (
                        <Card className="group hover:shadow-lg transition-shadow sm:col-span-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Hash className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                                      Payment Reference
                                    </p>
                                    <Badge className="bg-primary/20 text-primary text-xs">
                                      Important!
                                    </Badge>
                                  </div>
                                  <p className="font-bold font-mono text-xl text-primary">
                                    {bankDetails?.payment_reference}
                                  </p>
                                  <div className="mt-3 space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Always include this reference with your
                                      payment
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      <strong>Note:</strong> This reference
                                      number is displayed on the admin side.
                                      When you make a payment (e.g., via EFT),
                                      include this number as your proof of
                                      reference so the admin can verify and
                                      match your payment to your account.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    bankDetails?.payment_reference || "",
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
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className="w-full sm:w-[80%] p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs sm:text-sm">
                      <strong className="text-primary">Important:</strong>{" "}
                      Always include your payment reference number to ensure
                      proper allocation of your payment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-full sm:w-[80%] p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs sm:text-sm text-amber-900">
                      <strong className="text-amber-700">
                        Registration Status:
                      </strong>{" "}
                      Your registration will remain <strong>Pending</strong>{" "}
                      until the club administrator confirms receipt of your
                      payment.
                      {data.support_email && (
                        <>
                          {" "}
                          If you don't receive confirmation within a
                          reasonable timeframe, please contact the club at:{" "}
                          <a
                            href={`mailto:${data.support_email}`}
                            className="font-semibold text-amber-700 hover:text-amber-800 underline"
                          >
                            {data.support_email}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            {data?.payfast_enabled &&
              data?.club_member_exists &&
              (bankDetails?.outstanding_amount ?? 0) > 0 && (
                <TabsContent
                  value="online"
                  className="pt-4 flex-1 overflow-y-auto"
                >
                  <div className="flex justify-center pr-4">
                    <div className="max-w-2xl w-full">
                      <PayFastPayment
                        clubAccountId={data?.club_account_id ?? ""}
                        outstandingAmount={bankDetails?.outstanding_amount ?? 0}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            {data?.custom_payment_methods &&
              data.custom_payment_methods.map((method: any, index: number) => (
                <TabsContent
                  key={index}
                  value={`custom-${index}`}
                  className="pt-4 flex-1 overflow-y-auto"
                >
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-semibold">{method.name}</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Click the button below to proceed to {method.name} for
                        payment
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        onClick={() => window.open(method.url, "_blank")}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pay with {method.name}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </Pager>
  );
}
