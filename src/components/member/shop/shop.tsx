import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Minus,
  Plus,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Receipt,
  Clock3,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import { formatAmount } from "@/data/currencies";
import { useFetchClub } from "@/queries/clubs";
import { getClubProducts } from "@/services/shop";
import { cancelOrder, createOrder, getMemberOrders } from "@/services/orders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const useFetchClubProducts = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['club-products', clubAccountId],
    queryFn: () => getClubProducts(clubAccountId),
    enabled: !!clubAccountId,
  });
};

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  allowMultiple: boolean;
  imageUrl?: string;
};

type ShopProduct = {
  product_id: number;
  name: string;
  price: number;
  description?: string;
  product_image_url?: string;
  purchase_limit?: "single" | "multiple" | string;
  active_product?: boolean;
};

type MemberOrderItem = {
  product_id?: string;
  name?: string;
  quantity?: number;
  refund_quantity?: number;
  fulfillment_quantity?: number;
  price?: number;
  subtotal?: number;
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

const useFetchMemberOrders = (clubAccountId: string) => {
  return useQuery({
    queryKey: ["member-shop-orders", clubAccountId],
    queryFn: () => getMemberOrders(clubAccountId),
    enabled: !!clubAccountId,
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

type MemberShopPageProps = {
  embedded?: boolean;
};

export default function MemberShopPage({ embedded = false }: MemberShopPageProps) {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch club data to check registration status
  const { data: clubData, isLoading: isClubLoading } = useFetchClub(clubId || "");
  
  // Fetch club products from API
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useFetchClubProducts(clubData?.club_account_id || "");
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
  } = useFetchMemberOrders(clubData?.club_account_id || "");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<MemberOrder | null>(null);

  const clubCurrency = clubData?.currency || "ZAR";
  const availableProducts = useMemo<ShopProduct[]>(() => {
    const products = Array.isArray(productsData?.products)
      ? (productsData.products as ShopProduct[])
      : [];

    return products.filter((product) => product.active_product);
  }, [productsData?.products]);

  const memberOrders = useMemo<MemberOrder[]>(() => {
    return Array.isArray(ordersData?.orders) ? ordersData.orders : [];
  }, [ordersData?.orders]);

  const pendingOrdersCount = useMemo(
    () => memberOrders.filter((order) => order.payment_status === "PENDING" || order.payment_status === "PARTIALLY_PAID").length,
    [memberOrders],
  );

  const fulfilledOrdersCount = useMemo(
    () => memberOrders.filter((order) => order.fulfillment_status === "FULFILLED").length,
    [memberOrders],
  );

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

  const totalCartItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);
  const hasCartItems = totalCartItems > 0;
  
  // Check if user is registered with the club
  useEffect(() => {
    if (!isClubLoading && clubData) {
      // If user is not a club member or not registered, redirect back
      if (!clubData.club_member_exists || !clubData.registered) {
        toast.error("You must be a registered member to access the shop");
        navigate(`/myclubs/${clubId}`);
        return;
      }
    }
  }, [clubData, isClubLoading, navigate, clubId]);

  // Scroll to top when component mounts
  useEffect(() => {
    if (embedded) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [embedded]);

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
  
  // Show access denied if not registered
  if (clubData && (!clubData.club_member_exists || !clubData.registered)) {
    return (
      <div className={cn("flex items-center justify-center", embedded ? "min-h-[320px]" : "min-h-screen bg-gray-50")}>
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You must be a registered member to access the club shop.
          </p>
          <Button onClick={() => navigate(`/myclubs/${clubId}/shop`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Club
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
          <Button onClick={() => navigate(`/myclubs/${clubId}/shop`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Club
          </Button>
        </div>
      </div>
    );
  }

  const addToCart = (product: ShopProduct) => {
    const existingItem = cart.find(item => item.productId === product.product_id);
    
    if (existingItem) {
      if (product.purchase_limit === "single") {
        toast.error("This item can only be purchased once");
        return;
      }
      
      setCart(cart.map(item => 
        item.productId === product.product_id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        productId: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        allowMultiple: product.purchase_limit === "multiple",
        imageUrl: product.product_image_url,
      };
      setCart([...cart, newItem]);
    }
    
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setShowCart(false);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
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

    const orderRequest = {
      club_account_id: clubData?.club_account_id,
      items: cart.map(item => ({
        product_id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      total_amount: getTotalAmount(),
      total_items: getTotalItems(),
    };

    try {
      const response = await createOrder(orderRequest);
      
      toast.success(response.message || "Order created successfully!");
      setCart([]);
      setOrderDialog(false);
      setShowCart(false);
      
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
    <div className={cn(embedded ? "bg-transparent" : "min-h-screen bg-background")}>
      <div className={cn(
        "mx-auto max-w-7xl",
        embedded ? "px-0 py-0" : "px-3 py-2 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
      )}>
        <div className="space-y-2.5 sm:space-y-4">
          <Card className="overflow-hidden py-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
            <CardContent className="space-y-2 p-2 sm:space-y-6 sm:p-6">
              <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1 sm:space-y-3">
                  {!embedded ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/myclubs/${clubId}`)}
                      className="h-5 w-fit px-0 text-[10px] text-slate-600 hover:bg-transparent hover:text-slate-900 sm:h-9 sm:text-sm"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                      Back to club
                    </Button>
                  ) : null}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 sm:h-12 sm:w-12 sm:rounded-2xl">
                      <ShoppingBag className="h-4 w-4 text-slate-700 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h1 className="text-base font-semibold tracking-tight leading-tight sm:text-3xl">
                        Member shop
                      </h1>
                    </div>
                  </div>
                  <p className="hidden max-w-2xl text-sm leading-6 text-slate-600 sm:block sm:text-base">
                    Browse club merchandise, build your cart, and then jump into your order history only when you need it.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-3 sm:gap-2">
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-center shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-left">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">Products</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{availableProducts.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-center shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-left">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">Orders</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{memberOrders.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-center shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-left">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] sm:tracking-[0.18em]">Cart</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{formatAmount(cartTotal, clubCurrency)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full py-2 overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
            <CardContent className="flex h-full flex-col gap-2.5 p-2.5 sm:gap-4 sm:p-6">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                  Quick actions
                </p>
                <h2 className="text-sm font-semibold sm:text-xl">Shop control panel</h2>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:rounded-3xl sm:p-4">
                <div className="flex items-center justify-between gap-3 sm:block">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-xs sm:tracking-[0.18em]">Pending orders</p>
                    <p className="mt-0.5 text-xl font-semibold tracking-tight sm:mt-2 sm:text-3xl">{pendingOrdersCount}</p>
                  </div>
                  <div className="text-right sm:mt-1 sm:text-left">
                    <p className="text-[11px] text-slate-500 sm:text-sm">
                      {fulfilledOrdersCount} fulfilled
                    </p>
                  </div>
                </div>
                <p className="mt-1 hidden text-xs text-slate-500 sm:mt-1 sm:block sm:text-sm">
                  {fulfilledOrdersCount} fulfilled so far
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full justify-between border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50 sm:h-11 sm:px-3 sm:text-sm"
                  onClick={() => setShowOrdersSection((value) => !value)}
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    {showOrdersSection ? (
                      <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    <span className="truncate">
                      {showOrdersSection ? "Back to items" : "View orders"}
                    </span>
                  </span>
                  <ChevronRight className={cn("h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4", showOrdersSection && "rotate-180")} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {hasCartItems ? (
          <div className="sticky top-32 z-30 mt-2 sm:top-20 sm:mt-6">
            <div className="rounded-[1.1rem] border border-slate-200 bg-slate-950 px-2.5 py-2 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] sm:rounded-[1.4rem] sm:px-4 sm:py-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300 sm:text-xs sm:tracking-[0.2em]">
                    Active Cart
                  </p>
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-white sm:mt-1 sm:text-sm">
                    {totalCartItems} item{totalCartItems === 1 ? "" : "s"} selected
                  </p>
                  <p className="hidden text-[11px] text-slate-300 sm:mt-0.5 sm:block sm:text-xs">
                    {formatAmount(cartTotal, clubCurrency)} ready to review.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="h-8 border-slate-600 bg-slate-900 px-2.5 text-[10px] font-semibold text-white hover:bg-slate-800 hover:text-white sm:h-10 sm:px-4 sm:text-xs"
                  >
                    <span className="sm:hidden">Clear</span>
                    <span className="hidden sm:inline">Clear cart</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowCart(true)}
                    className="h-8 bg-white px-2.5 text-[10px] font-semibold text-slate-950 hover:bg-slate-100 sm:h-10 sm:px-4 sm:text-xs"
                  >
                    <ShoppingCart className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
                    <span className="sm:hidden">Cart</span>
                    <span className="hidden sm:inline">Go to cart</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-3 space-y-2.5 sm:mt-6 sm:space-y-4">
          {showOrdersSection ? (
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
                <div className="grid gap-4 xl:grid-cols-2">
                  {memberOrders.map((order) => {
                    const orderItems = Array.isArray(order.items) ? order.items : [];
                    const totalItems = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                    const createdDate = order.created_date
                      ? new Date(order.created_date * 1000).toLocaleDateString()
                      : "Unknown date";
                    const isPendingOrder = order.payment_status === "PENDING";
                    const canContinuePayment =
                      (order.payment_status === "PENDING" ||
                        order.payment_status === "PARTIALLY_PAID") &&
                      Boolean(order.order_id);

                    return (
                      <div key={order.order_id || order.transaction_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-900">
                              Order #{order.order_id?.slice(0, 8) || "N/A"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-4 w-4" />
                                {createdDate}
                              </span>
                              <span>{totalItems} item{totalItems === 1 ? "" : "s"}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={cn("font-medium", getPaymentStatusBadgeClassName(order.payment_status))}>
                              {order.payment_status || "Unknown payment status"}
                            </Badge>
                            <Badge className={cn("font-medium", getFulfillmentStatusBadgeClassName(order.fulfillment_status))}>
                              {order.fulfillment_status || "Unknown fulfillment"}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                            <p className="mt-2 text-lg font-semibold text-slate-950">
                              {formatAmount(order.total_amount || 0, clubCurrency)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount paid</p>
                            <p className="mt-2 text-lg font-semibold text-slate-950">
                              {formatAmount(order.amount_paid || 0, clubCurrency)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {orderItems.map((item, index) => {
                            const quantity = Number(item.quantity || 0);
                            const deliveredQuantity = Math.min(
                              Number(item.fulfillment_quantity || 0),
                              quantity,
                            );
                            const refundedQuantity = Math.min(
                              Number(item.refund_quantity || 0),
                              Math.max(quantity - deliveredQuantity, 0),
                            );
                            const pendingQuantity = Math.max(
                              quantity - deliveredQuantity - refundedQuantity,
                              0,
                            );

                            return (
                              <div
                                key={`${order.order_id || "order"}-${item.product_id || item.name || index}`}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-900">{item.name || "Unnamed item"}</p>
                                  <p className="text-slate-500">Qty {item.quantity || 0}</p>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {deliveredQuantity > 0 ? (
                                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                        Delivered {deliveredQuantity}
                                      </span>
                                    ) : null}
                                    {pendingQuantity > 0 ? (
                                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                        Not delivered {pendingQuantity}
                                      </span>
                                    ) : null}
                                    {refundedQuantity > 0 ? (
                                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                        Refunded {refundedQuantity}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <p className="font-semibold text-slate-900">
                                  {formatAmount(item.subtotal || 0, clubCurrency)}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {canContinuePayment || isPendingOrder ? (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            {canContinuePayment ? (
                              <Button
                                className="bg-black text-white hover:bg-slate-900"
                                onClick={() => {
                                  const queryParams = new URLSearchParams({
                                    orderId: order.order_id || "",
                                    paymentScreen: "true",
                                  });

                                  navigate(`/myclubs/${clubId}/payments?${queryParams.toString()}`);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Continue to payment
                              </Button>
                            ) : null}
                            {isPendingOrder ? (
                              <Button
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                onClick={() => setSelectedOrderForCancel(order)}
                              >
                                Cancel order
                              </Button>
                            ) : null}
                          </div>
                        ) : order.fulfillment_status === "FULFILLED" || order.fulfillment_status === "DELIVERED" ? (
                          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                            <CheckCircle className="h-4 w-4" />
                            Order fulfilled
                          </div>
                        ) : null}
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
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                    Shop catalog
                  </p>
                  <h2 className="text-base font-semibold tracking-tight leading-tight sm:text-3xl">
                    Items for sale
                  </h2>
                  <p className="hidden mt-1 text-sm leading-6 text-slate-500 sm:block">
                    Choose what you want first. Orders and payment follow after checkout.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 shadow-sm sm:px-3 sm:py-2 sm:text-sm">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {totalCartItems} item{totalCartItems === 1 ? "" : "s"} in cart
                </div>
              </div>

              {availableProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-slate-400" />
                  <h2 className="mt-4 text-lg font-medium text-slate-900">No products available</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Check back later for new merchandise.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                  {availableProducts.map((product) => {
                    const inCartQuantity = cart.find(item => item.productId === product.product_id)?.quantity || 0;

                    return (
                      <Card
                        key={product.product_id}
                        className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_20px_60px_-34px_rgba(15,23,42,0.18)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_28px_70px_-34px_rgba(15,23,42,0.24)]"
                      >
                        <div className="aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/3]">
                          {product.product_image_url ? (
                            <img
                              src={product.product_image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-16 w-16 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <CardHeader className="space-y-1.5 p-2 sm:space-y-4 sm:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="line-clamp-2 text-xs leading-4 text-slate-950 sm:text-lg sm:leading-6">{product.name}</CardTitle>
                              <p className="mt-0.5 text-sm font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                {formatAmount(product.price, clubCurrency)}
                              </p>
                            </div>
                            {inCartQuantity > 0 ? (
                              <Badge className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 sm:text-xs">
                                {inCartQuantity}
                              </Badge>
                            ) : null}
                          </div>
                          <CardDescription className="line-clamp-2 min-h-0 text-[10px] leading-3.5 text-slate-500 sm:min-h-12 sm:text-sm sm:leading-6">
                            {product.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1.5 p-2 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-[9px] text-slate-600 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                            <span>Limit</span>
                            <span className="font-medium text-slate-900">
                              {product.purchase_limit === "multiple" ? "Multiple" : "Single"}
                            </span>
                          </div>
                          <Button onClick={() => addToCart(product)} className="h-7 w-full bg-black px-2 text-[10px] text-white hover:bg-slate-900 sm:h-11 sm:text-sm">
                            <ShoppingCart className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                            Add
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                  <div key={item.productId} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatAmount(item.price, clubCurrency)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={!item.allowMultiple}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
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
        <DialogContent className="max-w-md border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
            <DialogDescription>
              Please review your order details before confirming
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Order Summary</Label>
              <div className="mt-2 space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatAmount(item.price * item.quantity, clubCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>{formatAmount(getTotalAmount(), clubCurrency)}</span>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📧 Confirm your order and proceed to payment.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder}>
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