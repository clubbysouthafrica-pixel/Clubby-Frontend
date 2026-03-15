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
  ShoppingBag,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useFetchClub, useFetchClubBankDetails } from "@/queries/clubs";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
import { getMemberOrders } from "@/services/orders";
import { getVenues } from "@/services/venues";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

import { RegistrationTabContent } from "@/components/member/registration/registration-tab-content";
import { ShopTab } from "@/components/member/shop/shop-tab";
import PaymentsTabContent from "@/components/member/payments/payments-tab-content";
import MemberBookings from "@/components/member/bookings/member-bookings";
import { PayFastPayment } from "@/components/payments/payfast-payment";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { updatePaymentReferenceService } from "@/services/profile";
import { toast } from "sonner";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import InfoRow from "@/components/info-row";
import SocialLink from "@/components/social-links";

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
  const { search } = useLocation();

  // Handle query params on component mount and when search changes
  useEffect(() => {
    const queryParams = new URLSearchParams(search);
    const tabParam = queryParams.get('tab');
    const orderIdParam = queryParams.get('orderId');
    
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Auto-select order if orderId is in query params and bankDetails are loaded
    if (orderIdParam && bankDetails?.order_options && !bankDetailsLoading) {
      const matchedOrder = bankDetails.order_options.find(
        (order: any) => order.order_id === orderIdParam || order.id === orderIdParam
      );
      
      if (matchedOrder) {
        setNewOrderId(orderIdParam);
        setShowOrderSelection(true);
      }
    }
  }, [search, bankDetails?.order_options, bankDetailsLoading]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingReference, setEditingReference] = useState(false);
  const [newReference, setNewReference] = useState(
    bankDetails?.registration_payment_reference || "",
  );
  const [savingReference, setSavingReference] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [showOrderSelection, setShowOrderSelection] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [orderSortColumn, setOrderSortColumn] = useState<'date' | 'payment_status' | 'fulfillment_status' | 'total' | null>(null);
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('asc');
  const [venues, setVenues] = useState<any[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [selectedGalleryImageIndex, setSelectedGalleryImageIndex] = useState<number | null>(null);

  const {
    data: memberOrders,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["member-orders", data?.club_account_id],
    queryFn: () => getMemberOrders(data?.club_account_id || ""),
    enabled:
      !!data?.club_account_id &&
      !!data?.club_member_exists &&
      activeTab === "shop",
  });

  const handleOrderSort = (
    column: "date" | "payment_status" | "fulfillment_status" | "total",
  ) => {
    if (orderSortColumn === column) {
      setOrderSortDirection(orderSortDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderSortColumn(column);
      setOrderSortDirection("asc");
    }
  };

  const sortedOrders = useMemo(() => {
    if (!memberOrders?.orders) return [];

    const sorted = [...memberOrders.orders];

    if (!orderSortColumn) return sorted;

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (orderSortColumn === "date") {
        aValue = a.created_date || 0;
        bValue = b.created_date || 0;
      } else if (orderSortColumn === "payment_status") {
        aValue = a.payment_status || "";
        bValue = b.payment_status || "";
      } else if (orderSortColumn === "fulfillment_status") {
        aValue = a.fulfillment_status || "";
        bValue = b.fulfillment_status || "";
      } else if (orderSortColumn === "total") {
        aValue = a.total_amount || 0;
        bValue = b.total_amount || 0;
      }

      if (typeof aValue === "string") {
        return orderSortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return orderSortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [memberOrders, orderSortColumn, orderSortDirection]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePayHereClick = (order?: any) => {
    if (order) {
      setSelectedOrder(order);
      if (!bankDetailsLoading && bankDetails) {
        setPaymentDialogOpen(true);
      } else {
        toast.error("Payment details are still loading. Please wait...");
      }
    } else if (
      bankDetails?.order_options &&
      bankDetails.order_options.length > 0
    ) {
      setShowOrderSelection(true);
    } else {
      if (!bankDetailsLoading && bankDetails) {
        setPaymentDialogOpen(true);
      } else {
        toast.error("Payment details are still loading. Please wait...");
      }
    }
  };

  const handlePayNowClick = () => {
    handlePayHereClick();
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
        newReference,
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

  useEffect(() => {
    if (activeTab !== "bookings" || !data?.club_account_id) {
      console.log("Skipping venues fetch:", { activeTab, clubAccountId: data?.club_account_id });
      return;
    }

    console.log("Fetching venues for tab:", activeTab);

    const fetchVenues = async () => {
      try {
        setVenuesLoading(true);
        setVenuesError(null);
        console.log("Fetching venues with club_account_id:", data.club_account_id);
        const venuseData = await getVenues(data.club_account_id);
        console.log("Venues fetched:", venuseData);
        setVenues(venuseData.venues || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load venues";
        setVenuesError(errorMsg);
        console.error("Error fetching venues:", err, errorMsg);
      } finally {
        setVenuesLoading(false);
      }
    };

    fetchVenues();
  }, [activeTab, data?.club_account_id]);

  const getStatusIcon = (
    isRegistered: boolean,
    resubmissionRequired: boolean,
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
    resubmissionRequired: boolean,
  ) => {
    if (resubmissionRequired) {
      return "text-red-600";
    }
    return isRegistered ? "text-green-600" : "text-orange-600";
  };

  const getStatusTitle = (
    isRegistered: boolean,
    resubmissionRequired: boolean,
  ) => {
    if (resubmissionRequired) {
      return "Resubmission Required";
    }
    return isRegistered ? "Registration Confirmed" : "Registration Pending";
  };

  const getStatusDescription = (
    isRegistered: boolean,
    resubmissionRequired: boolean,
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
                        {(data?.club_url ||
                          data?.facebook ||
                          data?.instagram ||
                          data?.twitter) && (
                          <section>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {data?.club_url && (
                                <SocialLink
                                  icon={<Globe />}
                                  label="Website"
                                  onClick={() =>
                                    window.open(data.club_url, "_blank")
                                  }
                                />
                              )}
                              {data?.facebook && (
                                <SocialLink
                                  icon={<FaFacebook />}
                                  label="Facebook"
                                  onClick={() =>
                                    window.open(data.facebook, "_blank")
                                  }
                                />
                              )}
                              {data?.instagram && (
                                <SocialLink
                                  icon={<FaInstagram />}
                                  label="Instagram"
                                  onClick={() =>
                                    window.open(data.instagram, "_blank")
                                  }
                                />
                              )}
                              {data?.twitter && (
                                <SocialLink
                                  icon={<FaTwitter />}
                                  label="Twitter"
                                  onClick={() =>
                                    window.open(data.twitter, "_blank")
                                  }
                                />
                              )}
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="flex flex-col gap-4 min-w-fit">
                        {data?.club_member_exists && (
                          <div className="text-center">
                            {!data.resubmission_required && (
                              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                                <div className="flex items-center justify-center gap-2">
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
                                        : "bg-orange-100 text-orange-800 border-orange-200",
                                    )}
                                  >
                                    {data.registered
                                      ? "Active Member"
                                      : "Pending Member"}
                                  </Badge>
                                </div>
                                {data.registered &&
                                  bankDetails?.outstanding_amount > 0 && (
                                    <div className="text-center space-y-2">
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Outstanding Balance:
                                        </p>
                                        <p className="text-sm font-semibold text-red-600">
                                          {formatAmount(
                                            bankDetails.outstanding_amount,
                                            data.currency,
                                          )}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setActiveTab("bank");
                                          setTimeout(() => {
                                            handlePayHereClick();
                                          }, 100);
                                        }}
                                        className="text-xs h-auto py-1"
                                      >
                                        <CreditCard className="w-3 h-3 mr-1" />
                                        Pay Now
                                      </Button>
                                    </div>
                                  )}
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
                                      data.currency,
                                    )}
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handlePayNowClick}
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
                          data.resubmission_required,
                        )}
                        <h3
                          className={`text-sm font-semibold ${getStatusColor(
                            data.registered,
                            data.resubmission_required,
                          )}`}
                        >
                          {getStatusTitle(
                            data.registered,
                            data.resubmission_required,
                          )}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {getStatusDescription(
                          data.registered,
                          data.resubmission_required,
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
                }}
              >
                {data?.club_member_exists && (
                  <TabsList
                    className={cn(
                      "bg-background/50 backdrop-blur-sm border border-primary/20 shadow-lg",
                      isMobile
                        ? "flex flex-col h-auto w-full gap-1 p-1"
                        : "justify-start h-12 w-full",
                    )}
                  >
                    <TabsTrigger
                      className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
                        isMobile
                          ? "w-full justify-center text-sm h-10"
                          : "w-[200px] h-10",
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
                            : "w-[200px] h-10",
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
                            : "w-[200px] h-10",
                        )}
                        value="member-registration"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Registration
                      </TabsTrigger>
                    )}
                    {data?.club_member_exists && data?.venues_enabled && (
                      <TabsTrigger
                        className={cn(
                          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
                          isMobile
                            ? "w-full justify-center text-sm h-10"
                            : "w-[200px] h-10",
                        )}
                        value="bookings"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Bookings
                      </TabsTrigger>
                    )}
                    {!data?.resubmission_required && (
                      <ShopTab
                        clubId={clubId!}
                        isMobile={isMobile}
                        isClubMember={
                          data?.club_member_exists ||
                          data?.resubmission_required
                        }
                        isRegistered={data?.registered}
                      />
                    )}
                  </TabsList>
                )}
                <RegistrationTabContent
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

                <TabsContent value="shop" className="mt-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">
                                My Orders
                              </CardTitle>
                              <CardDescription className="text-base">
                                View your order history and shop for new items
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            onClick={() => navigate(`/myclubs/${clubId}/shop`)}
                            className="flex items-center gap-2"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            Go to Shop
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div
                          className={`${memberOrders?.orders && memberOrders.orders.length > 5 ? "max-h-96 overflow-y-auto" : "overflow-hidden"}`}
                        >
                          <Table className="border-0">
                            <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 sticky top-0 z-10">
                              <TableRow className="border-primary/10 hover:bg-transparent">
                                <TableHead className="text-center flex-1 font-semibold">
                                  Order #
                                </TableHead>
                                <TableHead
                                  className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleOrderSort("date")}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    Date
                                    {orderSortColumn === "date" &&
                                      (orderSortDirection === "asc" ? (
                                        <ArrowUp className="h-4 w-4" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead className="text-center flex-1 font-semibold">
                                  Items
                                </TableHead>
                                <TableHead
                                  className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleOrderSort("total")}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    Total
                                    {orderSortColumn === "total" &&
                                      (orderSortDirection === "asc" ? (
                                        <ArrowUp className="h-4 w-4" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead className="text-center flex-1 font-semibold">
                                  Amount Paid
                                </TableHead>
                                <TableHead
                                  className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() =>
                                    handleOrderSort("payment_status")
                                  }
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    Payment Status
                                    {orderSortColumn === "payment_status" &&
                                      (orderSortDirection === "asc" ? (
                                        <ArrowUp className="h-4 w-4" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() =>
                                    handleOrderSort("fulfillment_status")
                                  }
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    Fulfillment Status
                                    {orderSortColumn === "fulfillment_status" &&
                                      (orderSortDirection === "asc" ? (
                                        <ArrowUp className="h-4 w-4" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4" />
                                      ))}
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isOrdersLoading && (
                                <TableRow>
                                  <TableCell
                                    colSpan={7}
                                    className="text-center py-8"
                                  >
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="text-muted-foreground mt-2">
                                      Loading orders...
                                    </p>
                                  </TableCell>
                                </TableRow>
                              )}
                              {ordersError && (
                                <TableRow>
                                  <TableCell
                                    colSpan={7}
                                    className="text-center py-8 text-red-600"
                                  >
                                    Failed to load orders. Please try again
                                    later.
                                  </TableCell>
                                </TableRow>
                              )}
                              {!isOrdersLoading &&
                                !ordersError &&
                                memberOrders?.orders?.length === 0 && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={7}
                                      className="text-center py-8 text-muted-foreground"
                                    >
                                      No orders yet. Start shopping to see your
                                      orders here!
                                    </TableCell>
                                  </TableRow>
                                )}
                              {!isOrdersLoading &&
                                !ordersError &&
                                sortedOrders?.map((order: any) => (
                                  <TableRow
                                    key={order.order_id}
                                    className="hover:bg-primary/5 transition-colors border-primary/10 group"
                                  >
                                    <TableCell className="text-center flex-1 py-4">
                                      <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                        #{order.order_id?.slice(0, 8) || "N/A"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4">
                                      {order.created_date
                                        ? new Date(
                                            order.created_date * 1000,
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4">
                                      <div className="space-y-1">
                                        {order.items?.map(
                                          (item: any, index: number) => (
                                            <div
                                              key={index}
                                              className="text-sm"
                                            >
                                              {item.name} x{item.quantity}
                                            </div>
                                          ),
                                        ) || (
                                          <div className="text-sm">
                                            No items
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4 font-semibold">
                                      {formatAmount(
                                        order.total_amount || 0,
                                        data.currency,
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4 font-semibold">
                                      {formatAmount(
                                        order.amount_paid || 0,
                                        data.currency,
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4">
                                      <div className="flex flex-col items-center gap-2">
                                        <Badge
                                          className={`font-medium ${
                                            order.payment_status === "PAID" ||
                                            order.payment_status ===
                                              "PAID (Partial Refund)"
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : order.payment_status ===
                                                  "PENDING"
                                                ? "bg-orange-100 text-orange-800 border-orange-200 mt-2"
                                                : order.payment_status ===
                                                    "PARTIALLY_PAID"
                                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                                  : order.payment_status ===
                                                        "CANCELLED" ||
                                                      order.payment_status ===
                                                        "REFUND"
                                                    ? "bg-red-100 text-red-800 border-red-200"
                                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                          }`}
                                        >
                                          {order.payment_status || "Unknown"}
                                        </Badge>
                                        {(order.payment_status === "PENDING" ||
                                          order.payment_status ===
                                            "PARTIALLY_PAID") && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs underline h-6 px-2 text-red-600"
                                            onClick={() => setActiveTab("bank")}
                                          >
                                            Pay Now
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center flex-1 py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <Badge
                                          className={`font-medium ${
                                            order.fulfillment_status ===
                                            "DELIVERED"
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : order.fulfillment_status ===
                                                  "NOT_PROCESSED"
                                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                                : order.fulfillment_status ===
                                                    "PROCESSING"
                                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                                  : order.fulfillment_status ===
                                                        "CANCELLED" ||
                                                      order.fulfillment_status ===
                                                        "REFUND" ||
                                                      order.fulfillment_status ===
                                                        "REFUNDED"
                                                    ? "bg-red-100 text-red-800 border-red-200"
                                                    : "bg-green-100 text-green-800 border-green-200"
                                          }`}
                                        >
                                          {order.fulfillment_status ||
                                            "Unknown"}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="bookings" className="mt-6">
                  <MemberBookings
                    venues={venues}
                    loading={venuesLoading}
                    error={venuesError}
                    memberName={data?.member_name || ""}
                  />
                </TabsContent>

                <TabsContent value="home" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
                    <div className="space-y-6">
                      {/* CONTACT INFO */}
                      <section>
                        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Club Information
                        </h3>

                        <Card className="rounded-2xl">
                          <CardContent className="space-y-5 p-5">
                            <InfoRow
                              icon={<Mail />}
                              label="Support Email"
                              value={data.support_email}
                            />

                            <InfoRow
                              icon={<MapPin />}
                              label="Location"
                              value={countryName}
                            />

                            <InfoRow
                              icon={<Calendar />}
                              label="Established"
                              value={epochToJoinedString(data.joined)}
                            />
                          </CardContent>
                        </Card>
                      </section>

                      {data?.opening_times && (
                        <section>
                          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Opening Times
                          </h3>

                          <Card className="rounded-2xl">
                            <CardContent className="divide-y p-0">
                              {Array.isArray(data.opening_times)
                                ? data.opening_times.map(
                                    (times: any, idx: number) => {
                                      const daysOfWeek = [
                                        "Monday",
                                        "Tuesday",
                                        "Wednesday",
                                        "Thursday",
                                        "Friday",
                                        "Saturday",
                                        "Sunday",
                                      ];
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between px-5 py-3 text-sm"
                                        >
                                          <span className="capitalize font-medium">
                                            {daysOfWeek[idx]}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {times.closed
                                              ? "Closed"
                                              : `${times.open} – ${times.close}`}
                                          </span>
                                        </div>
                                      );
                                    },
                                  )
                                : Object.entries(data.opening_times).map(
                                    ([day, times]: [string, any]) => (
                                      <div
                                        key={day}
                                        className="flex items-center justify-between px-5 py-3 text-sm"
                                      >
                                        <span className="capitalize font-medium">
                                          {day}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {times.open} – {times.close}
                                        </span>
                                      </div>
                                    ),
                                  )}
                            </CardContent>
                          </Card>
                        </section>
                      )}
                    </div>

                    <div className="sm:col-span-2 space-y-6">
                      {data?.about_club && (
                        <section>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Club Description
                          </h3>

                          <Card className="rounded-2xl border-0 shadow-none">
                            <CardContent className="p-2">
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {data.about_club}
                              </p>
                            </CardContent>
                          </Card>
                        </section>
                      )}

                      {/* GALLERY */}
                      <section>
                        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Gallery
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {data?.gallery_images && data.gallery_images.length > 0 ? (
                            data.gallery_images.map((image: any, idx: number) => (
                              <button
                                key={image.key}
                                onClick={() => setSelectedGalleryImageIndex(idx)}
                                className="relative rounded-lg overflow-hidden shadow-sm bg-muted transition-shadow hover:shadow-md cursor-pointer hover:opacity-90"
                              >
                                <img
                                  src={image.url}
                                  alt="Gallery"
                                  className="w-full h-32 object-cover block"
                                />
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No gallery images</p>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </TabsContent>

                {data?.club_member_exists && (
                  <PaymentsTabContent
                    data={data}
                    bankDetails={bankDetails}
                    transactions={transactions}
                    isUserTransactionsLoading={isUserTransactionsLoading}
                    expandedRows={expandedRows}
                    editingReference={editingReference}
                    newReference={newReference}
                    savingReference={savingReference}
                    toggleRow={toggleRow}
                    setEditingReference={setEditingReference}
                    setNewReference={setNewReference}
                    handleSaveReference={handleSaveReference}
                    handleCancelEdit={handleCancelEdit}
                    handlePayHereClick={handlePayNowClick}
                  />
                )}
              </Tabs>
            </div>
          </div>
        )}

      {/* Order Selection Dialog */}
      <Dialog open={showOrderSelection} onOpenChange={setShowOrderSelection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Select Order to Pay
            </DialogTitle>
            <DialogDescription>
              Choose which order you want to make a payment for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bankDetails?.order_options?.map((order: any, index: number) => {
              const totalAmount =
                order.items?.reduce(
                  (sum: number, item: any) => sum + (item.subtotal || 0),
                  0,
                ) || 0;

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    (order.order_id === newOrderId || order.id === newOrderId)
                      ? "border-yellow-400 bg-yellow-50 border-2"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderSelection(false);
                    handlePayHereClick(order);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">
                      {order.title || `Order ${index + 1}`}
                    </h4>
                    <span className="font-bold text-primary">
                      {formatAmount(totalAmount, data?.currency)}
                    </span>
                  </div>
                  {order.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {order.description}
                    </p>
                  )}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-1">
                      {order.items.map((item: any, itemIndex: number) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.name} (x{item.quantity})
                          </span>
                          <span>
                            {formatAmount(item.subtotal || 0, data?.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setSelectedOrder(null);
          }
        }}
      >
        <DialogContent className="!w-[1000px] !h-[820px] !max-w-none !max-h-none p-5 gap-4 flex flex-col min-h-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6 text-primary" />
              Payment Options
            </DialogTitle>
            <div className="space-y-1">
              {selectedOrder ? (
                <>
                  <DialogDescription className="text-base">
                    Order Total:{" "}
                    <span className="font-semibold text-foreground">
                      {formatAmount(
                        selectedOrder.total_amount || 0,
                        data?.currency,
                      )}
                    </span>
                  </DialogDescription>
                  <DialogDescription className="text-base">
                    Amount Paid:{" "}
                    <span className="font-semibold text-foreground">
                      {formatAmount(
                        selectedOrder?.total_amount -
                          selectedOrder?.outstanding_amount || 0,
                        data?.currency,
                      )}
                    </span>
                  </DialogDescription>
                  <DialogDescription className="text-base">
                    Outstanding Amount:{" "}
                    <span className="font-semibold text-foreground text-orange-600">
                      {formatAmount(
                        selectedOrder?.outstanding_amount || 0,
                        data?.currency,
                      )}
                    </span>
                  </DialogDescription>
                  {selectedOrder.order_id && (
                    <DialogDescription className="text-base">
                      Order ID:{" "}
                      <span className="font-semibold text-foreground">
                        {selectedOrder.order_id}
                      </span>
                    </DialogDescription>
                  )}
                </>
              ) : (
                <DialogDescription className="text-base">
                  Outstanding Balance:{" "}
                  <span className="font-semibold text-foreground">
                    {formatAmount(
                      bankDetails?.outstanding_amount,
                      data?.currency,
                    )}
                  </span>
                </DialogDescription>
              )}
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
                  ),
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
                                  "account",
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
                                  "branch",
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
                                  "type",
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
                                    "reference",
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
                  <div className="w-full sm:w-[100%] p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs sm:text-sm">
                      <strong className="text-primary">Important:</strong>{" "}
                      Always include your payment reference number to ensure
                      proper allocation of your payment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-full sm:w-[100%] p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200">
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
                          If you don't receive confirmation within a reasonable
                          timeframe, please contact the club at:{" "}
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
                        outstandingAmount={
                          selectedOrder
                            ? selectedOrder?.outstanding_amount || 0
                            : (bankDetails?.outstanding_amount ?? 0)
                        }
                        orderId={selectedOrder?.order_id}
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

      {/* Gallery Image Dialog */}
      <Dialog
        open={selectedGalleryImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedGalleryImageIndex(null)}
      >
        <DialogContent className="max-w-4xl max-h-screen flex items-center justify-center p-0 bg-black/90 border-0">
          {selectedGalleryImageIndex !== null && data?.gallery_images && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={data.gallery_images[selectedGalleryImageIndex].url}
                alt="Gallery"
                className="w-full h-full object-contain"
              />
              
              {data.gallery_images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedGalleryImageIndex(
                        selectedGalleryImageIndex === 0
                          ? data.gallery_images.length - 1
                          : selectedGalleryImageIndex - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="w-6 h-6 text-white" />
                  </button>
                  
                  <button
                    onClick={() =>
                      setSelectedGalleryImageIndex(
                        selectedGalleryImageIndex === data.gallery_images.length - 1
                          ? 0
                          : selectedGalleryImageIndex + 1,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    aria-label="Next image"
                  >
                    <ArrowRight className="w-6 h-6 text-white" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
                    <p className="text-white text-sm">
                      {selectedGalleryImageIndex + 1} / {data.gallery_images.length}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Pager>
  );
}
