import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Package,
  Ticket,
  Minus,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  Loader2,
  Receipt,
  Clock3,
  ShoppingBag,
} from "lucide-react";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import { formatAmount } from "@/data/currencies";
import { useFetchClub } from "@/queries/clubs";
import { useGetProfileQuery } from "@/queries/profile";
import { getClubProducts } from "@/services/shop";
import { cancelOrder, createOrder, getMemberOrders, publicCreateOrder } from "@/services/orders";
import { getMemberClubAssociation, updateMemberEmailOptIn } from "@/services/member/club-member";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  formatTicketDateLabel,
  normalizeTicketValidDayOptions,
} from "@/lib/shop-valid-days";
import { cn } from "@/lib/utils";

const useFetchClubProducts = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['club-products', clubAccountId],
    queryFn: () => getClubProducts(clubAccountId),
    enabled: !!clubAccountId,
  });
};

type CartItem = {
  cartKey: string;
  productId: string | number;
  name: string;
  price: number;
  quantity: number;
  allowMultiple: boolean;
  requiresValidDay?: boolean;
  selectedValidDay?: string;
  imageUrl?: string;
};

type ShopProduct = {
  product_id: string | number;
  name: string;
  price: number;
  description?: string;
  product_image_url?: string;
  purchase_limit?: "single" | "multiple" | string;
  active_product?: boolean;
  product_type?: "standard" | "ticket" | string;
  valid_day_start_date?: string;
  valid_day_end_date?: string;
  excluded_valid_day_options?: string[];
  valid_day_options?: string[];
};

type MemberOrderItem = {
  product_id?: string;
  name?: string;
  quantity?: number;
  refund_quantity?: number;
  fulfillment_quantity?: number;
  price?: number;
  subtotal?: number;
  selected_valid_day?: string;
};

type MemberOrder = {
  order_id?: string;
  transaction_id?: string;
  created_date?: number;
  payment_status?: string;
  fulfillment_status?: string;
  total_amount?: number;
  amount_paid?: number;
  items?: MemberOrderItem[];
};

const useFetchMemberOrders = (clubAccountId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["member-shop-orders", clubAccountId],
    queryFn: () => getMemberOrders(clubAccountId),
    enabled: !!clubAccountId && enabled,
  });
};

function getPaymentStatusBadgeClassName(status?: string) {
  if (status === "PENDING" || status === "PARTIALLY_PAID") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status?.includes("REFUND") || status === "CANCELLED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getFulfillmentStatusBadgeClassName(status?: string) {
  if (status === "DELIVERED" || status === "FULFILLED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status === "PARTIALLY_DELIVERED" ||
    status === "PARTIALLY_FULFILLED"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "PROCESSING") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "NOT_PROCESSED") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function normalizeValidDayOptions(product?: ShopProduct | null) {
  return normalizeTicketValidDayOptions(product);
}

function productRequiresValidDay(product?: ShopProduct | null) {
  return product?.product_type === "ticket";
}

function buildCartKey(productId: string | number, selectedValidDay?: string) {
  return selectedValidDay
    ? `${String(productId)}::${selectedValidDay}`
    : String(productId);
}

const TICKET_CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthKey(value: string) {
  return value.slice(0, 7);
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return { year, monthIndex: month - 1 };
}

function shiftMonthKey(monthKey: string, offset: number) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const nextDate = new Date(Date.UTC(year, monthIndex + offset, 1));

  return `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatCalendarMonth(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);

  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildTicketCalendarDays(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const leadingDays = monthStart.getUTCDay();
  const calendarStart = new Date(Date.UTC(year, monthIndex, 1 - leadingDays));

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(calendarStart.getTime() + index * 24 * 60 * 60 * 1000);
    const dateKey = current.toISOString().slice(0, 10);

    return {
      dateKey,
      dayNumber: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === monthIndex,
    };
  });
}

type MemberShopPageProps = {
  embedded?: boolean;
  compact?: boolean;
  productsOnly?: boolean;
};

export default function MemberShopPage({
  embedded = false,
  compact = false,
  productsOnly = false,
}: MemberShopPageProps) {
  const { clubId, productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext) as AuthContextType | undefined;
  const isLoggedIn = !!auth?.user;
  
  // Fetch club data to check registration status
  const { data: clubData, isLoading: isClubLoading } = useFetchClub(clubId || "");
  const canAttemptOrderHistoryQuery =
    (!!clubData?.club_member_exists && !!clubData?.registered) ||
    (isLoggedIn && !!clubData?.enable_shop && clubData?.public_shop === true);
  
  // Fetch club products from API
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useFetchClubProducts(clubData?.club_account_id || "");
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
  } = useFetchMemberOrders(
    clubData?.club_account_id || "",
    canAttemptOrderHistoryQuery,
  );
  const { data: profileData } = useGetProfileQuery(auth?.isAdmin ?? false, isLoggedIn);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<MemberOrder | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [pendingDayProduct, setPendingDayProduct] = useState<ShopProduct | null>(null);
  const [pendingSelectedValidDay, setPendingSelectedValidDay] = useState("");
  const [pendingCalendarMonth, setPendingCalendarMonth] = useState("");
  const [publicCheckoutEmail, setPublicCheckoutEmail] = useState("");
  const [publicCheckoutFirstName, setPublicCheckoutFirstName] = useState("");
  const [publicCheckoutSurname, setPublicCheckoutSurname] = useState("");
  const [publicEmailOptIn, setPublicEmailOptIn] = useState(false);
  const [memberEmailOptIn, setMemberEmailOptIn] = useState(false);
  const [memberOptInChecked, setMemberOptInChecked] = useState(false);
  const [memberHasExistingOptIn, setMemberHasExistingOptIn] = useState(false);
  const clubCurrency = clubData?.currency || "ZAR";
  const availableProducts = useMemo<ShopProduct[]>(() => {
    const products = Array.isArray(productsData?.products)
      ? (productsData.products as ShopProduct[])
      : [];

    return products.filter((product) => product.active_product);
  }, [productsData?.products]);

  const filteredProducts = availableProducts;

  const memberOrders = useMemo<MemberOrder[]>(() => {
    return Array.isArray(ordersData?.orders) ? ordersData.orders : [];
  }, [ordersData?.orders]);
  const selectedPublicProduct = useMemo(() => {
    if (!productsOnly || !productId) {
      return null;
    }

    return (
      availableProducts.find(
        (product) => String(product.product_id) === productId,
      ) ??
      null
    );
  }, [availableProducts, productId, productsOnly]);

  const canBrowsePublicShop =
    !!clubData?.enable_shop && clubData?.public_shop === true;
  const hasMemberShopAccess =
    !!clubData?.club_member_exists && !!clubData?.registered;
  const canAttemptOrderHistory =
    hasMemberShopAccess || (isLoggedIn && canBrowsePublicShop);
  const canAccessShop = hasMemberShopAccess || canBrowsePublicShop;
  const isPublicCheckout = canBrowsePublicShop && !hasMemberShopAccess;
  const isPublicShopRoute = !isLoggedIn && canBrowsePublicShop;
  const shouldUseProfileCheckoutIdentity = isPublicCheckout && isLoggedIn;
  const canShowOrderHistory = canAttemptOrderHistory && !compact && !productsOnly;
  const showingOrdersSection = canShowOrderHistory && showOrdersSection;
  const backToClubPath = isPublicShopRoute
    ? `/clubs/${clubId}`
    : `/myclubs/${clubId}`;
  const backButtonLabel = productsOnly ? "Back to shop" : "Back to club";
  const catalogHeading = isPublicShopRoute
    ? clubData?.club_name || "Shop products"
    : "Items for sale";
  const isPublicProductPage = productsOnly && Boolean(productId);

  const handleConfirmCancelOrder = async () => {
    const order = selectedOrderForCancel;

    if (
      !order ||
      !clubData?.club_account_id ||
      !order.order_id ||
      !order.transaction_id
    ) {
      toast.error("This order is missing the details required to cancel it.");
      return;
    }

    try {
      setCancellingOrderId(order.order_id);
      await cancelOrder({
        transaction_id: order.transaction_id,
        club_account_id: clubData.club_account_id,
        order_id: order.order_id,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["member-shop-orders", clubData.club_account_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["getClubBankDetails", clubData.club_account_id],
        }),
      ]);
      setSelectedOrderForCancel(null);
      toast.success("Order cancelled successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel the order.",
      );
    } finally {
      setCancellingOrderId(null);
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getInCartQuantity = (productId: string | number) =>
    cart.reduce(
      (total, item) =>
        String(item.productId) === String(productId) ? total + item.quantity : total,
      0,
    );

  const totalCartItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);
  const hasCartItems = totalCartItems > 0;
  
  // Check if user is registered with the club
  useEffect(() => {
    if (!isClubLoading && clubData) {
      if (!canAccessShop) {
        toast.error("This shop is only available to registered club members");
        navigate(backToClubPath);
        return;
      }
    }
  }, [backToClubPath, canAccessShop, clubData, isClubLoading, navigate, clubId]);

  // Scroll to top when component mounts
  useEffect(() => {
    if (embedded) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [embedded]);

  useEffect(() => {
    if (!orderDialog || !isLoggedIn || !clubData?.club_account_id || !clubData?.user_id) return;
    setMemberOptInChecked(false);
    setMemberHasExistingOptIn(false);
    setMemberEmailOptIn(false);
    getMemberClubAssociation(clubData.club_account_id, String(clubData.user_id))
      .then(() => { setMemberHasExistingOptIn(true); setMemberOptInChecked(true); })
      .catch(() => { setMemberHasExistingOptIn(false); setMemberOptInChecked(true); });
  }, [orderDialog, isLoggedIn, clubData?.club_account_id, clubData?.user_id]);

  // Show loading state while checking registration or loading products
  if (isClubLoading || isProductsLoading) {
    return (
      <div className={cn("flex items-center justify-center", embedded ? "min-h-[320px]" : "min-h-screen bg-gray-50")}>
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }
  
  if (clubData && !canAccessShop) {
    return (
      <div className={cn("flex items-center justify-center", embedded ? "min-h-[320px]" : "min-h-screen bg-gray-50")}>
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            This shop is only available to registered members of the club.
          </p>
          <Button onClick={() => navigate(backToClubPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backButtonLabel}
          </Button>
        </div>
      </div>
    );
  }
  
  // Handle products error
  if (productsError) {
    return (
      <div className={cn("flex items-center justify-center", embedded ? "min-h-[320px]" : "min-h-screen bg-gray-50")}>
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">
            Failed to load shop products. Please try again later.
          </p>
          <Button onClick={() => navigate(backToClubPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backButtonLabel}
          </Button>
        </div>
      </div>
    );
  }

  const closeValidDayDialog = () => {
    setPendingDayProduct(null);
    setPendingSelectedValidDay("");
    setPendingCalendarMonth("");
  };

  const pendingValidDayOptions = normalizeValidDayOptions(pendingDayProduct);
  const pendingValidDaySet = new Set(pendingValidDayOptions);

  const pendingMinMonth = pendingValidDayOptions[0]
    ? getMonthKey(pendingValidDayOptions[0])
    : "";
  const pendingMaxMonth = pendingValidDayOptions.length
    ? getMonthKey(pendingValidDayOptions[pendingValidDayOptions.length - 1])
    : "";

  const activePendingMonth =
    pendingCalendarMonth ||
    (pendingSelectedValidDay ? getMonthKey(pendingSelectedValidDay) : pendingMinMonth);

  const pendingCalendarDays = activePendingMonth
    ? buildTicketCalendarDays(activePendingMonth)
    : [];

  const addToCart = (product: ShopProduct, selectedValidDay?: string) => {
    const requiresValidDay = productRequiresValidDay(product);
    const normalizedDay = selectedValidDay?.trim();

    if (requiresValidDay && !normalizedDay) {
      toast.error("Choose a valid day before adding this ticket to your cart.");
      return;
    }

    if (product.purchase_limit === "single" && getInCartQuantity(product.product_id) > 0) {
      toast.error("This item can only be purchased once");
      return;
    }

    const cartKey = buildCartKey(product.product_id, normalizedDay);
    const existingItem = cart.find((item) => item.cartKey === cartKey);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
      return;
    }

    const newItem: CartItem = {
      cartKey,
      productId: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      allowMultiple: product.purchase_limit === "multiple",
      requiresValidDay,
      selectedValidDay: normalizedDay,
      imageUrl: product.product_image_url,
    };

    setCart([...cart, newItem]);
  };

  const startAddToCart = (product: ShopProduct) => {
    if (!productRequiresValidDay(product)) {
      addToCart(product);
      return;
    }

    const validDayOptions = normalizeValidDayOptions(product);

    if (validDayOptions.length === 0) {
      toast.error("This ticket does not have any valid day options configured yet.");
      return;
    }

    setPendingDayProduct(product);
    setPendingSelectedValidDay(validDayOptions[0]);
    setPendingCalendarMonth(getMonthKey(validDayOptions[0]));
  };

  const openProductDetails = (product: ShopProduct) => {
    if (productsOnly && clubId) {
      navigate(`/clubs/${clubId}/shop/${product.product_id}`);
      return;
    }

    setSelectedProduct(product);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  const removeFromCart = (cartKey: string) => {
    setCart(cart.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };

  const updateQuantity = (cartKey: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    setCart(cart.map(item => 
      item.cartKey === cartKey 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cartTotal;
  };

  const getTotalItems = () => {
    return totalCartItems;
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const trimmedPublicEmail = shouldUseProfileCheckoutIdentity
      ? typeof profileData?.email === "string"
        ? profileData.email.trim()
        : ""
      : publicCheckoutEmail.trim();
    const trimmedPublicFirstName = shouldUseProfileCheckoutIdentity
      ? typeof profileData?.first_name === "string"
        ? profileData.first_name.trim()
        : ""
      : publicCheckoutFirstName.trim();
    const trimmedPublicSurname = shouldUseProfileCheckoutIdentity
      ? typeof profileData?.surname === "string"
        ? profileData.surname.trim()
        : ""
      : publicCheckoutSurname.trim();

    if (isPublicCheckout) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!trimmedPublicFirstName) {
        toast.error(
          shouldUseProfileCheckoutIdentity
            ? "Your Clubby profile is missing a first name. Update your profile before placing this order."
            : "Enter your first name to place a public shop order.",
        );
        return;
      }

      if (!trimmedPublicSurname) {
        toast.error(
          shouldUseProfileCheckoutIdentity
            ? "Your Clubby profile is missing a surname. Update your profile before placing this order."
            : "Enter your last name to place a public shop order.",
        );
        return;
      }

      if (!trimmedPublicEmail) {
        toast.error(
          shouldUseProfileCheckoutIdentity
            ? "Your Clubby profile is missing an email address. Update your profile before placing this order."
            : "Enter an email address to place a public shop order.",
        );
        return;
      }

      if (!emailPattern.test(trimmedPublicEmail)) {
        toast.error("Enter a valid email address to continue.");
        return;
      }
    }

    try {
      const totalAmount = getTotalAmount();
      const orderItems = cart.map((item) => ({
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        selected_valid_day: item.selectedValidDay,
      }));

      const orderRequest = {
        club_account_id: clubData?.club_account_id,
        items: orderItems,
        total_amount: totalAmount,
        total_items: getTotalItems(),
      };

      const response = isPublicCheckout
        ? await publicCreateOrder({
            ...orderRequest,
            email: trimmedPublicEmail,
            first_name: trimmedPublicFirstName,
            surname: trimmedPublicSurname,
            email_opt_in: publicEmailOptIn,
          })
        : await createOrder(orderRequest);
      
      toast.success(response.message || "Order created successfully!");
      if (isLoggedIn && memberOptInChecked && !memberHasExistingOptIn && clubData?.club_account_id) {
        updateMemberEmailOptIn(clubData.club_account_id, memberEmailOptIn).catch(() => {});
      }
      setCart([]);
      setOrderDialog(false);
      setShowCart(false);

      if (totalAmount === 0) {
        const orderId = response?.order_id || response?.id;
        if (orderId) {
          navigate(`/myclubs/${clubId}/orders/${orderId}`);
        } else {
          navigate(backToClubPath);
        }
        return;
      }

      if (isPublicCheckout) {
        const queryParams = new URLSearchParams();
        const orderId = response?.order_id || response?.id;

        queryParams.set('paymentScreen', 'true');

        if (orderId && clubData?.payfast_enabled) {
          queryParams.set('orderId', String(orderId));
        }

        if (response?.transaction_id) {
          queryParams.set('transactionId', response.transaction_id);
        }

        if (response?.user_id) {
          queryParams.set('userId', response.user_id);
        }

        queryParams.set('amount', String(totalAmount));

        if (typeof clubData?.payfast_enabled === 'boolean') {
          queryParams.set('payfastEnabled', String(clubData.payfast_enabled));
        }

        if (typeof clubData?.snapscan_enabled === 'boolean') {
          queryParams.set('snapscanEnabled', String(clubData.snapscan_enabled));
        }

        if (response?.bank) queryParams.set('bank', response.bank);
        if (response?.account_number) queryParams.set('accountNumber', response.account_number);
        if (response?.account_type) queryParams.set('accountType', response.account_type);
        if (response?.branch_code) queryParams.set('branchCode', response.branch_code);

        navigate(`/clubs/${clubId}/payments?${queryParams.toString()}`);
        return;
      }
      
      // Redirect to the payments section with the new order highlighted.
      const orderId = response.order_id || response.id;
      const queryParams = new URLSearchParams();
      if (orderId) {
        queryParams.append('orderId', orderId);
      }
      queryParams.append('paymentScreen', 'true');

      navigate(`/myclubs/${clubId}/payments?${queryParams.toString()}`);
    } catch (error: unknown) {
      console.error("Error creating order:", error);
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : "Failed to create order. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div
      className={cn(
        embedded
          ? "bg-transparent"
          : "min-h-screen bg-white",
        embedded && compact && "h-full min-h-0",
      )}
    >
      <div className={cn(
        "mx-auto max-w-7xl",
        embedded
          ? compact
            ? "px-0 py-0"
            : "px-0 py-0"
          : "px-3 py-2 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
        embedded && compact && "flex h-full min-h-0 flex-col",
        hasCartItems && "pb-0",
      )}>

        {hasCartItems ? (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white px-4 py-3 sm:px-10 sm:py-7">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900 sm:text-xl">
                {totalCartItems} item{totalCartItems === 1 ? "" : "s"} in cart
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearCart}
                  className="h-10 rounded-full px-5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:h-14 sm:px-9 sm:text-lg"
                >
                  Clear cart
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCart(true)}
                  className="h-10 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 sm:h-14 sm:px-9 sm:text-lg"
                >
                  <ShoppingCart className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-6 sm:w-6" />
                  Go to cart
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            compact
              ? "mt-2 flex min-h-0 flex-1 flex-col space-y-2"
              : "mt-3 space-y-2.5 sm:mt-6 sm:space-y-4",
          )}
        >
          {showingOrdersSection ? (
            <>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                    Order history
                  </p>
                  <h2 className="text-base font-semibold tracking-tight leading-tight sm:text-3xl">
                    Your orders
                  </h2>
                  <p className="hidden mt-1 text-sm leading-6 text-slate-500 sm:block">
                    Review what has been paid, delivered, processed, or still waiting.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm">
                  <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {memberOrders.length} order{memberOrders.length === 1 ? "" : "s"}
                </div>
              </div>

              <Card className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
            <CardHeader className="border-b border-slate-200/80">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <Receipt className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <CardTitle>Your orders</CardTitle>
                    <CardDescription>
                      Review payment progress and fulfillment without leaving the shop.
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowOrdersSection(false)}>
                  Back to items
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isOrdersLoading ? (
                <div className="flex min-h-40 flex-col items-center justify-center text-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="mt-3 text-sm">Loading your orders...</p>
                </div>
              ) : memberOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <Receipt className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">No orders yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Start with the items for sale. Your order history will appear here once you place something.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  {memberOrders.map((order) => {
                    const orderId = order.order_id || order.transaction_id;
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const totalItems = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                    const createdDate = order.created_date
                      ? new Date(order.created_date * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "Unknown date";

                    return (
                      <div
                        key={orderId}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate(`/myclubs/${clubId}/orders/${orderId}`, {
                            state: { order, currency: clubCurrency },
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate(`/myclubs/${clubId}/orders/${orderId}`, {
                              state: { order, currency: clubCurrency },
                            });
                        }}
                        className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5 transition-colors last:border-b-0 hover:bg-slate-50 sm:gap-4 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              Order #{order.order_id?.slice(0, 8) || "N/A"}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Clock3 className="h-3 w-3" />
                              {createdDate}
                            </span>
                            <span className="text-xs text-slate-400">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge className={cn("text-[11px] font-medium", getPaymentStatusBadgeClassName(order.payment_status))}>
                              {order.payment_status || "Unknown"}
                            </Badge>
                            <Badge className={cn("text-[11px] font-medium", getFulfillmentStatusBadgeClassName(order.fulfillment_status))}>
                              {order.fulfillment_status || "Unknown"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatAmount(order.total_amount || 0, clubCurrency)}
                          </p>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          ) : (
            <>
              {!compact ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!isPublicProductPage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(backToClubPath)}
                        className="h-8 w-fit px-0 text-[10px] text-slate-600 hover:bg-transparent hover:text-slate-900 sm:h-9 sm:text-sm"
                      >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                        Back to club
                      </Button>
                    ) : null}
                    {canShowOrderHistory && !productsOnly ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 justify-between border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 sm:h-11 sm:text-sm"
                        onClick={() => setShowOrdersSection((value) => !value)}
                      >
                        <Receipt className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                        {showOrdersSection ? "Back to shop" : "View orders"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm">
                    <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {totalCartItems} item{totalCartItems === 1 ? "" : "s"} in cart
                  </div>
                </div>
              ) : null}

              {compact ? (
                <div className="flex min-h-0 flex-1 flex-col space-y-1.5 overflow-y-auto pr-0.5 max-h-64 sm:max-h-80 xl:max-h-none xl:pr-1">
                  {filteredProducts.map((product) => {
                    const inCartQuantity = getInCartQuantity(product.product_id);

                    return (
                      <div
                        key={product.product_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openProductDetails(product)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openProductDetails(product);
                          }
                        }}
                        className="rounded-[1rem] border border-slate-200 bg-slate-50 px-2.5 py-2 shadow-sm transition-colors hover:border-slate-300 hover:bg-white sm:rounded-[1.1rem] sm:px-3 sm:py-3"
                      >
                        <div className="flex items-center gap-2.5 sm:items-start sm:gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-16 sm:w-16 sm:rounded-xl">
                            {product.product_image_url ? (
                              <img
                                src={product.product_image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : product.product_type === "ticket" ? (
                              <div className="flex h-full items-center justify-center bg-amber-50">
                                <Ticket className="h-4 w-4 text-amber-500 sm:h-6 sm:w-6" />
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-4 w-4 text-slate-400 sm:h-6 sm:w-6" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex items-center gap-1.5">
                                <p className="line-clamp-1 text-xs font-semibold text-slate-950 sm:text-sm lg:text-base">
                                  {product.name}
                                </p>
                                {inCartQuantity > 0 ? (
                                  <Badge className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700">
                                    {inCartQuantity}
                                  </Badge>
                                ) : null}
                              </div>
                              <Button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startAddToCart(product);
                                }}
                                className="h-6 shrink-0 rounded-full bg-black px-2.5 text-[10px] text-white hover:bg-slate-900 sm:h-8 sm:px-3 sm:text-[11px] lg:text-[13px]"
                              >
                                <ShoppingCart className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Add
                              </Button>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              {product.price === 0 ? (
                                <Badge className="cursor-default bg-emerald-100 text-[10px] text-emerald-700 hover:bg-emerald-100 px-1.5 py-0">Free</Badge>
                              ) : (
                                <p className="text-[11px] font-semibold text-slate-700 sm:text-sm">{formatAmount(product.price, clubCurrency)}</p>
                              )}
                              <p className="line-clamp-1 text-[10px] leading-4 text-slate-400 sm:text-[11px]">
                                {product.description || ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isPublicProductPage ? (
                selectedPublicProduct ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="relative z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/clubs/${clubId}/shop`)}
                        className="h-8 px-0 text-sm text-slate-600 hover:bg-transparent hover:text-slate-900"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to catalog
                      </Button>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[88px_minmax(0,1.1fr)_380px] lg:items-start">
                      <aside className="hidden space-y-4 lg:block">
                        <div className="overflow-hidden rounded-sm border-2 border-slate-900 bg-white shadow-sm">
                          {selectedPublicProduct.product_image_url ? (
                            <img
                              src={selectedPublicProduct.product_image_url}
                              alt={selectedPublicProduct.name}
                              className="h-20 w-20 object-cover"
                            />
                          ) : selectedPublicProduct.product_type === "ticket" ? (
                            <div className="flex h-20 w-20 items-center justify-center bg-amber-50">
                              <Ticket className="h-8 w-8 text-amber-500" />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center bg-stone-100">
                              <Package className="h-8 w-8 text-stone-400" />
                            </div>
                          )}
                        </div>
                      </aside>

                      <section className="overflow-hidden bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
                        {selectedPublicProduct.product_image_url ? (
                          <img
                            src={selectedPublicProduct.product_image_url}
                            alt={selectedPublicProduct.name}
                            className="h-full max-h-[78vh] w-full object-cover"
                          />
                        ) : selectedPublicProduct.product_type === "ticket" ? (
                          <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-orange-50">
                            <div className="rounded-full bg-amber-100 p-6">
                              <Ticket className="h-20 w-20 text-amber-500" />
                            </div>
                            {(selectedPublicProduct.valid_day_start_date || selectedPublicProduct.valid_day_end_date) ? (
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">
                                {selectedPublicProduct.valid_day_start_date ? formatTicketDateLabel(selectedPublicProduct.valid_day_start_date) : ""}
                                {selectedPublicProduct.valid_day_end_date && selectedPublicProduct.valid_day_end_date !== selectedPublicProduct.valid_day_start_date
                                  ? ` – ${formatTicketDateLabel(selectedPublicProduct.valid_day_end_date)}`
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex min-h-[520px] items-center justify-center bg-stone-100">
                            <Package className="h-24 w-24 text-stone-400" />
                          </div>
                        )}
                      </section>

                      <aside className="space-y-6 pt-2">
                      <div>
                        <p className="text-2xl font-semibold uppercase tracking-[0.04em] text-slate-700 sm:text-3xl">
                          {selectedPublicProduct.name}
                        </p>
                        {selectedPublicProduct.price === 0 ? (
                          <div className="mt-4">
                            <Badge className="cursor-default bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-base px-3 py-1">Free</Badge>
                          </div>
                        ) : (
                          <p className="mt-4 text-3xl font-semibold text-slate-700">
                            {formatAmount(selectedPublicProduct.price, clubCurrency)}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          Price listed in {clubCurrency}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-sm">
                        <ShoppingBag className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-700">
                          Available to order
                        </span>
                      </div>

                      <p className="text-sm leading-7 text-slate-600">
                        {selectedPublicProduct.description ||
                          "No additional product description is available for this item yet."}
                      </p>

                      <p className="text-sm font-semibold text-emerald-700">
                        {selectedPublicProduct.active_product
                          ? "In stock"
                          : "Currently unavailable"}
                      </p>


                      <Button
                        type="button"
                        onClick={() => startAddToCart(selectedPublicProduct)}
                        className="h-14 w-full rounded-sm bg-slate-800 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-slate-700"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to bag
                      </Button>

                        <div className="space-y-3 border-t border-stone-300 pt-6 text-sm leading-7 text-slate-600">
                          <p className="font-semibold text-slate-800">Product Details</p>
                          <p>
                            Purchase type: {selectedPublicProduct.purchase_limit === "single"
                              ? "Single purchase"
                              : "Multiple quantity allowed"}
                          </p>
                          <p>
                            Club currency: {clubCurrency}
                          </p>
                          {getInCartQuantity(selectedPublicProduct.product_id) > 0 ? (
                            <p>
                              In cart: {getInCartQuantity(selectedPublicProduct.product_id)}
                            </p>
                          ) : null}
                        </div>
                      </aside>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50 px-6 py-14 text-center">
                    <Package className="mx-auto h-12 w-12 text-stone-400" />
                    <h2 className="mt-4 text-xl font-semibold text-slate-900">Product not found</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      The selected product could not be loaded. Return to the catalog and choose another item.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-6 rounded-full border-stone-200 px-5"
                      onClick={() => navigate(`/clubs/${clubId}/shop`)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to catalog
                    </Button>
                  </div>
                )
              ) : (
                <section className="space-y-8">
                    <div className="space-y-3 text-center">
                      {productsOnly ? (
                        <>
                          <h2 className="text-2xl font-semibold tracking-[0.04em] text-slate-900 sm:text-5xl">
                            {catalogHeading}
                          </h2>
                        </>
                      ) : null}
                      <div className="flex items-center justify-end">
                        <p className="text-sm font-semibold text-slate-600">
                          {filteredProducts.length} Result{filteredProducts.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-slate-400" />
                        <h2 className="mt-4 text-lg font-medium text-slate-900">No products available</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Check back later for new merchandise.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
                        {filteredProducts.map((product) => {
                          const inCartQuantity = getInCartQuantity(product.product_id);

                          return (
                            <article
                              key={product.product_id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openProductDetails(product)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openProductDetails(product);
                                }
                              }}
                              className="group space-y-2 transition-opacity hover:opacity-95 sm:space-y-4"
                            >
                              <div className="overflow-hidden bg-[#f4efe6]">
                                {product.product_image_url ? (
                                  <img
                                    src={product.product_image_url}
                                    alt={product.name}
                                    className="aspect-[4/4.2] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                  />
                                ) : product.product_type === "ticket" ? (
                                  <div className="flex aspect-[4/4.2] flex-col items-center justify-center gap-2 bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
                                    <Ticket className="h-10 w-10 text-amber-500 sm:h-14 sm:w-14" />
                                    {(product.valid_day_start_date || product.valid_day_end_date) ? (
                                      <p className="px-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-600 sm:text-[10px]">
                                        {product.valid_day_start_date ? formatTicketDateLabel(product.valid_day_start_date) : ""}
                                        {product.valid_day_end_date && product.valid_day_end_date !== product.valid_day_start_date
                                          ? ` – ${formatTicketDateLabel(product.valid_day_end_date)}`
                                          : ""}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="flex aspect-[4/4.2] items-center justify-center">
                                    <Package className="h-8 w-8 text-stone-400 sm:h-16 sm:w-16" />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1 text-center sm:space-y-2">
                                <div className="flex items-center justify-center gap-1.5">
                                  <h3 className="text-sm font-semibold tracking-[0.02em] text-slate-900 sm:text-xl sm:tracking-[0.04em]">
                                    {product.name}
                                  </h3>
                                  {inCartQuantity > 0 ? (
                                    <Badge className="border-pink-200 bg-pink-50 text-pink-700">
                                      {inCartQuantity}
                                    </Badge>
                                  ) : null}
                                </div>
                                {product.price === 0 ? (
                                  <Badge className="cursor-default bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Free</Badge>
                                ) : (
                                  <p className="text-xs text-slate-500 sm:text-sm">from {formatAmount(product.price, clubCurrency)}</p>
                                )}
                              </div>

                              <div className="flex justify-center">
                                <Button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    startAddToCart(product);
                                  }}
                                  className="h-8 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 sm:h-9 sm:px-6 sm:text-sm"
                                >
                                  <ShoppingCart className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                                  Add to cart
                                </Button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
              )}
            </>
          )}
          {hasCartItems && !compact && <div className="h-24 sm:h-40" aria-hidden="true" />}
        </div>
      </div>

      <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && closeProductDetails()}>
        <DialogContent className="max-w-3xl border-stone-200 bg-white p-0 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.45)]">
          {selectedProduct ? (
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <div className="bg-[#f4efe6]">
                {selectedProduct.product_image_url ? (
                  <img
                    src={selectedProduct.product_image_url}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                ) : selectedProduct.product_type === "ticket" ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-orange-50 md:min-h-[520px]">
                    <div className="rounded-full bg-amber-100 p-5">
                      <Ticket className="h-14 w-14 text-amber-500" />
                    </div>
                    {(selectedProduct.valid_day_start_date || selectedProduct.valid_day_end_date) ? (
                      <p className="px-4 text-center text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">
                        {selectedProduct.valid_day_start_date ? formatTicketDateLabel(selectedProduct.valid_day_start_date) : ""}
                        {selectedProduct.valid_day_end_date && selectedProduct.valid_day_end_date !== selectedProduct.valid_day_start_date
                          ? ` – ${formatTicketDateLabel(selectedProduct.valid_day_end_date)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center md:min-h-[520px]">
                    <Package className="h-20 w-20 text-stone-400" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold tracking-[0.03em] text-slate-950 sm:text-3xl">
                      {selectedProduct.name}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-sm leading-6 text-slate-500 sm:text-base">
                      {selectedProduct.description || "No description available for this product yet."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-8 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Price
                      </p>
                      {selectedProduct.price === 0 ? (
                        <div className="mt-2">
                          <Badge className="cursor-default bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-base px-3 py-1">Free</Badge>
                        </div>
                      ) : (
                        <p className="mt-2 text-3xl font-semibold text-slate-950">
                          {formatAmount(selectedProduct.price, clubCurrency)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-stone-200 bg-stone-50 text-slate-700">
                        {selectedProduct.purchase_limit === "single"
                          ? "Single purchase"
                          : "Multiple quantity"}
                      </Badge>
                      {getInCartQuantity(selectedProduct.product_id) > 0 ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {getInCartQuantity(selectedProduct.product_id)} in cart
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-8 flex-col gap-3 sm:flex-row sm:justify-start">
                  <Button
                    type="button"
                    className="rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800"
                    onClick={() => startAddToCart(selectedProduct)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to cart
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-stone-200 px-6 text-slate-700"
                    onClick={closeProductDetails}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDayProduct !== null} onOpenChange={(open) => !open && closeValidDayDialog()}>
        <DialogContent className="max-w-md border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
          <DialogHeader>
            <DialogTitle>Choose Ticket Day</DialogTitle>
            <DialogDescription>
              Select the day this ticket should be valid for before adding it to your cart.
            </DialogDescription>
          </DialogHeader>

          {pendingDayProduct ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="font-medium text-slate-900">{pendingDayProduct.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatAmount(pendingDayProduct.price, clubCurrency)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label>Valid day</Label>
                  {pendingSelectedValidDay ? (
                    <span className="text-sm font-medium text-slate-600">
                      {formatTicketDateLabel(pendingSelectedValidDay)}
                    </span>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
                  <div className="mb-2 flex items-center justify-between sm:mb-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-600"
                      onClick={() => setPendingCalendarMonth((current) => shiftMonthKey(current, -1))}
                      disabled={!activePendingMonth || !pendingMinMonth || activePendingMonth <= pendingMinMonth}
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-sm font-semibold text-slate-900">
                      {activePendingMonth ? formatCalendarMonth(activePendingMonth) : "Select a month"}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-600"
                      onClick={() => setPendingCalendarMonth((current) => shiftMonthKey(current, 1))}
                      disabled={!activePendingMonth || !pendingMaxMonth || activePendingMonth >= pendingMaxMonth}
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 sm:gap-1 sm:text-[11px] sm:tracking-[0.12em]">
                    {TICKET_CALENDAR_WEEKDAYS.map((weekday) => (
                      <span key={weekday} className="py-0.5 sm:py-1">
                        {weekday}
                      </span>
                    ))}
                  </div>

                  <div className="mt-0.5 grid grid-cols-7 gap-0.5 sm:mt-1 sm:gap-1">
                    {pendingCalendarDays.map((day) => {
                      const isSelected = day.dateKey === pendingSelectedValidDay;
                      const isEnabled = pendingValidDaySet.has(day.dateKey);

                      return (
                        <Button
                          key={day.dateKey}
                          type="button"
                          variant="ghost"
                          className={cn(
                            "h-8 rounded-lg p-0 text-xs font-medium sm:h-10 sm:rounded-xl sm:text-sm",
                            !day.isCurrentMonth && "text-slate-300",
                            day.isCurrentMonth && !isEnabled && "text-slate-300",
                            isEnabled && "bg-slate-50 text-slate-800 hover:bg-slate-100",
                            isSelected && "bg-slate-900 text-white hover:bg-slate-900",
                          )}
                          disabled={!isEnabled}
                          onClick={() => setPendingSelectedValidDay(day.dateKey)}
                          aria-pressed={isSelected}
                          title={isEnabled ? formatTicketDateLabel(day.dateKey) : undefined}
                        >
                          {day.dayNumber}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Only available ticket dates can be selected.
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeValidDayDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pendingDayProduct) {
                  return;
                }

                addToCart(pendingDayProduct, pendingSelectedValidDay);
                closeValidDayDialog();
              }}
              disabled={!pendingSelectedValidDay}
            >
              Add to cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              Review your items before placing your order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Your cart is empty</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatAmount(item.price, clubCurrency)} each
                      </p>
                      {item.selectedValidDay ? (
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-amber-700">
                          Valid for {formatTicketDateLabel(item.selectedValidDay)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        disabled={!item.allowMultiple}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.cartKey)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex items-center justify-between text-lg font-medium">
                  <span>Total:</span>
                  <span>{formatAmount(getTotalAmount(), clubCurrency)}</span>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCart(false)}>
              Continue Shopping
            </Button>
            <Button 
              onClick={() => {
                setShowCart(false);
                setOrderDialog(true);
              }}
              disabled={cart.length === 0}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border-slate-200 bg-white p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] sm:max-w-md sm:rounded-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirm Your Order</DialogTitle>
            <DialogDescription className="text-sm">
              Review your order details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Order Summary</p>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-700">
                      {item.name} <span className="text-slate-400">×{item.quantity}</span>
                      {item.selectedValidDay ? <span className="text-slate-400"> ({formatTicketDateLabel(item.selectedValidDay)})</span> : ""}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">{formatAmount(item.price * item.quantity, clubCurrency)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatAmount(getTotalAmount(), clubCurrency)}</span>
              </div>
            </div>

            {isLoggedIn && memberOptInChecked && !memberHasExistingOptIn ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                <Checkbox
                  checked={memberEmailOptIn}
                  onCheckedChange={(checked) => setMemberEmailOptIn(checked === true)}
                  className="mt-0.5"
                />
                <span>Opt me in to receive emails from this club.</span>
              </label>
            ) : null}

            {isPublicCheckout && !shouldUseProfileCheckoutIdentity ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="public-order-first-name" className="text-sm font-medium text-slate-900">
                      First name
                    </Label>
                    <Input
                      id="public-order-first-name"
                      type="text"
                      value={publicCheckoutFirstName}
                      onChange={(event) => setPublicCheckoutFirstName(event.target.value)}
                      placeholder="First name"
                      className="h-11 rounded-xl bg-white text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="public-order-surname" className="text-sm font-medium text-slate-900">
                      Last name
                    </Label>
                    <Input
                      id="public-order-surname"
                      type="text"
                      value={publicCheckoutSurname}
                      onChange={(event) => setPublicCheckoutSurname(event.target.value)}
                      placeholder="Last name"
                      className="h-11 rounded-xl bg-white text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="public-order-email" className="text-sm font-medium text-slate-900">
                    Email address
                  </Label>
                  <Input
                    id="public-order-email"
                    type="email"
                    value={publicCheckoutEmail}
                    onChange={(event) => setPublicCheckoutEmail(event.target.value)}
                    placeholder="your@email.com"
                    className="h-11 rounded-xl bg-white text-base sm:text-sm"
                  />
                  <p className="text-xs text-slate-500">Used for your order confirmation.</p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <Checkbox
                    checked={publicEmailOptIn}
                    onCheckedChange={(checked) => setPublicEmailOptIn(checked === true)}
                    className="mt-0.5"
                  />
                  <span>Opt me in to receive emails from this club.</span>
                </label>
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:gap-0">
            <Button variant="outline" className="w-full rounded-full sm:w-auto" onClick={() => setOrderDialog(false)}>
              Cancel
            </Button>
            <Button className="w-full rounded-full sm:w-auto" onClick={handleCreateOrder}>
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedOrderForCancel !== null}
        onOpenChange={(open) => {
          if (!open && !cancellingOrderId) {
            setSelectedOrderForCancel(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Remove Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {" "}
              {selectedOrderForCancel?.transaction_id?.substring(0, 8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-medium">
                  {selectedOrderForCancel?.order_id ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {formatAmount(
                    selectedOrderForCancel?.total_amount || 0,
                    clubCurrency,
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {selectedOrderForCancel?.payment_status ?? "Unknown"}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This will cancel the pending order and remove it from the payment
              flow.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedOrderForCancel(null)}
              disabled={Boolean(cancellingOrderId)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelOrder}
              disabled={Boolean(cancellingOrderId)}
            >
              {cancellingOrderId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Remove Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}