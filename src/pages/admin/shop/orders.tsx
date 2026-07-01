import { Fragment, useContext, useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import {
  getClubOrders,
  confirmOrderPayment,
  refundOrRemoveOrder,
  updateAdminOrderFulfillment,
} from "@/services/admin-features/orders";
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";

type OrderPaymentItem = {
  price?: number | null;
  refund_quantity?: number | null;
};

type OrderPaymentMeta = {
  payment_status?: string | null;
  total_amount?: number | null;
  amount_paid?: number | null;
  items?: OrderPaymentItem[] | null;
};

type OrderDisplayPaymentStatus =
  | "AWAITING_PAYMENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

function getOrderRefundedAmount(order: OrderPaymentMeta) {
  const normalizedStatus = order.payment_status?.trim().toUpperCase() || "";
  const refundedFromItems = Array.isArray(order.items)
    ? order.items.reduce(
        (sum, item) =>
          sum + (item.price || 0) * Math.max(item.refund_quantity || 0, 0),
        0,
      )
    : 0;

  if (refundedFromItems > 0) {
    return refundedFromItems;
  }

  if (normalizedStatus === "REFUND" || normalizedStatus === "REFUNDED") {
    return order.total_amount || 0;
  }

  if (
    normalizedStatus === "PAID_PARTIAL_REFUND" ||
    normalizedStatus === "PAID (PARTIAL REFUND)"
  ) {
    return Math.max((order.total_amount || 0) - (order.amount_paid || 0), 0);
  }

  return 0;
}

function getOrderEffectiveAmount(order: OrderPaymentMeta) {
  return Math.max((order.total_amount || 0) - getOrderRefundedAmount(order), 0);
}

function getOrderOutstandingAmount(order: OrderPaymentMeta) {
  return Math.max(
    getOrderEffectiveAmount(order) - (order.amount_paid || 0),
    0,
  );
}

function getOrderDisplayPaymentStatus(
  order: OrderPaymentMeta,
): OrderDisplayPaymentStatus {
  const normalizedStatus = order.payment_status?.trim().toUpperCase() || "";
  const refundedAmount = getOrderRefundedAmount(order);
  const outstandingAmount = getOrderOutstandingAmount(order);
  const amountPaid = order.amount_paid || 0;

  if (normalizedStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (
    normalizedStatus === "REFUND" ||
    normalizedStatus === "REFUNDED" ||
    (order.total_amount || 0) > 0 && refundedAmount >= (order.total_amount || 0)
  ) {
    return "REFUNDED";
  }

  if (amountPaid <= 0 && normalizedStatus !== "PAID") {
    return "AWAITING_PAYMENT";
  }

  if (outstandingAmount <= 0) {
    return "PAID";
  }

  return "PARTIALLY_PAID";
}

function getOrderPaymentLabel(order: OrderPaymentMeta) {
  switch (getOrderDisplayPaymentStatus(order)) {
    case "PAID":
      return "Paid";
    case "PARTIALLY_PAID":
      return "Partially paid";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Awaiting payment";
  }
}

function getOrderPaymentClassName(order: OrderPaymentMeta) {
  const displayStatus = getOrderDisplayPaymentStatus(order);

  if (displayStatus === "AWAITING_PAYMENT") {
    return "text-blue-700";
  }

  if (displayStatus === "PARTIALLY_PAID") {
    return "text-orange-600";
  }

  if (displayStatus === "REFUNDED" || displayStatus === "CANCELLED") {
    return "text-red-700";
  }

  return "text-green-700";
}

function shouldShowOrderPaymentProgress(order: OrderPaymentMeta) {
  const displayStatus = getOrderDisplayPaymentStatus(order);

  return (
    (displayStatus === "AWAITING_PAYMENT" ||
      displayStatus === "PARTIALLY_PAID") &&
    getOrderEffectiveAmount(order) > 0
  );
}

function shouldShowSingleOrderAmount(order: OrderPaymentMeta) {
  const displayStatus = getOrderDisplayPaymentStatus(order);

  return (
    displayStatus !== "AWAITING_PAYMENT" &&
    displayStatus !== "PARTIALLY_PAID"
  );
}

function getOrderMemberUserId(order: unknown) {
  if (
    typeof order === "object" &&
    order !== null &&
    "user_id" in order &&
    typeof order.user_id === "string" &&
    order.user_id.trim().length > 0
  ) {
    return order.user_id;
  }

  return null;
}

const PAYMENT_SORT_ORDER: Record<string, number> = {
  AWAITING_PAYMENT: 0,
  PARTIALLY_PAID: 1,
  PAID: 2,
  REFUNDED: 3,
  CANCELLED: 4,
};

const FULFILLMENT_SORT_ORDER: Record<string, number> = {
  NOT_PROCESSED: 0,
  PROCESSING: 1,
  PARTIALLY_DELIVERED: 2,
  DELIVERED: 3,
  REFUNDED: 4,
  CANCELLED: 5,
};

export default function OrdersPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Parse URL query params first
  const memberParam = searchParams.get("member");
  const paymentStatusParam = searchParams.get("paymentStatus");
  const fulfillmentStatusParam = searchParams.get("fulfillmentStatus");

  const parseMultiValueParam = (value: string | null) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      : [];

  const paymentStatusValues = parseMultiValueParam(paymentStatusParam);
  const fulfillmentStatusValues = parseMultiValueParam(fulfillmentStatusParam);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Filtering and pagination - initialize with URL params if present
  const [transactionIdSearch, setTransactionIdSearch] = useState("");
  const [memberNameSearch, setMemberNameSearch] = useState(memberParam || "");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>(paymentStatusValues);
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<string[]>(fulfillmentStatusValues);
  const [appliedFilters, setAppliedFilters] = useState<{
    transaction_id?: string;
    member_name?: string;
    payment_status?: string[];
    fulfillment_status?: string[];
  }>(() => {
    const filters: {
      transaction_id?: string;
      member_name?: string;
      payment_status?: string[];
      fulfillment_status?: string[];
    } = {};
    if (memberParam) filters.member_name = memberParam;
    if (paymentStatusValues.length) filters.payment_status = paymentStatusValues;
    if (fulfillmentStatusValues.length) filters.fulfillment_status = fulfillmentStatusValues;
    return filters;
  });
  const [ordersLimit, setOrdersLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [enableShop, setEnableShop] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined,
  );
  const isLoadingMoreRef = useRef(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] =
    useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] =
    useState<any>(null);
  const [selectedItemsForRefund, setSelectedItemsForRefund] = useState<
    Set<string>
  >(new Set());
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [expandedRefundItems, setExpandedRefundItems] = useState<Set<string>>(
    new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderForDelete, setSelectedOrderForDelete] =
    useState<any>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"date" | "payment" | "fulfillment" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (col: "date" | "payment" | "fulfillment") => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const sortedOrders = useMemo(() => {
    if (!sortColumn) return allOrders;
    return [...allOrders].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "date") {
        cmp = (a.created_date || 0) - (b.created_date || 0);
      } else if (sortColumn === "payment") {
        cmp = (PAYMENT_SORT_ORDER[getOrderDisplayPaymentStatus(a)] ?? 99) - (PAYMENT_SORT_ORDER[getOrderDisplayPaymentStatus(b)] ?? 99);
      } else if (sortColumn === "fulfillment") {
        cmp = (FULFILLMENT_SORT_ORDER[a.fulfillment_status?.toUpperCase() ?? ""] ?? 99) - (FULFILLMENT_SORT_ORDER[b.fulfillment_status?.toUpperCase() ?? ""] ?? 99);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [allOrders, sortColumn, sortDirection]);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);

  const hasFilterChanges =
    transactionIdSearch !== (appliedFilters.transaction_id ?? "") ||
    memberNameSearch !== (appliedFilters.member_name ?? "") ||
    JSON.stringify(paymentStatusFilter) !== JSON.stringify(appliedFilters.payment_status ?? []) ||
    JSON.stringify(fulfillmentStatusFilter) !== JSON.stringify(appliedFilters.fulfillment_status ?? []);

  // Calculate total undelivered items
  const undeliveredItems = allOrders
    .filter(
      (order) =>
        order.payment_status === "PAID" ||
        order.payment_status === "PAID (Partial Refund)",
    )
    .flatMap(
      (order) =>
        (order.items as any[])?.flatMap((item: any) => {
          const unfulfilled =
            (item.quantity || 0) - (item.fulfillment_quantity || 0);
          if (unfulfilled > 0) {
            return Array.from({ length: unfulfilled }).map((_, unitIdx) => ({
              orderId: order.order_id,
              transactionId: order.transaction_id,
              memberName: `${order.first_name} ${order.surname}`,
              itemName: item.name,
              itemPrice: item.price,
              productId: item.product_id,
              unitIndex: unitIdx + 1,
              totalUnfulfilled: unfulfilled,
            }));
          }
          return [];
        }) || [],
    );

  useEffect(() => {
    const fetchOrders = async () => {
      if (!club?.club_account_id) return;

      try {
        setIsLoading(true);
        const response = await getClubOrders(
          club.club_account_id,
          ordersLimit,
          pageToken,
          appliedFilters,
        );

        if (response.status === 200 && response.data?.orders) {
          if (isLoadingMoreRef.current) {
            setAllOrders((prev) => [...prev, ...response.data.orders]);
            isLoadingMoreRef.current = false;
          } else {
            setAllOrders(response.data.orders);
          }
          setEnableShop(response.data.shop_enabled || false);
          setNextPageToken(response.data?.pageToken);
          setPaymentMethods(response.data.payment_methods || []);
        }
      } catch (err: any) {
        setError("Failed to load orders");
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [club?.club_account_id, ordersLimit, pageToken, appliedFilters]);

  const toggleSelection = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((previousValues) =>
      previousValues.includes(value)
        ? previousValues.filter((item) => item !== value)
        : [...previousValues, value],
    );
  };

  const formatFilterLabel = (label: string, values: string[]) => {
    if (values.length === 0) {
      return `${label}: All`;
    }

    if (values.length === 1) {
      return `${label}: ${values[0].replaceAll("_", " ")}`;
    }

    return `${label}: ${values.length} selected`;
  };

  const handlePayNowClick = (order: Record<string, unknown>) => {
    setSelectedOrderForPayment(order);
    setPaymentAmount(formatAmount(0, club?.currency));
    if (paymentMethods && paymentMethods.length > 0) {
      const firstMethod = paymentMethods[0];
      const methodId =
        typeof firstMethod === "string"
          ? firstMethod
          : (firstMethod as Record<string, unknown>).name ||
            (firstMethod as Record<string, unknown>).method_id ||
            "0";
      setSelectedPaymentType(String(methodId));
    }
    setPaymentDialogOpen(true);
  };

  const handlePaymentAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputValue = e.target.value.replace(/[^\d]/g, "");
    const value = parseInt(inputValue || "0", 10);
    setPaymentAmount(formatAmount(value, club?.currency));
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderForPayment) return;

    // Validate payment method is selected
    if (!selectedPaymentType) {
      toast.error("Please select a payment method");
      return;
    }

    // Parse the payment amount (remove currency formatting)
    const amountString = paymentAmount.replace(/[^\d]/g, "");
    const amountInCents = parseInt(amountString || "0", 10);

    // Calculate remaining amount to be paid
    const remainingAmount =
      (selectedOrderForPayment.total_amount || 0) -
      (selectedOrderForPayment.amount_paid || 0);

    // Validate payment amount
    if (amountInCents <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    if (amountInCents !== remainingAmount) {
      toast.error(
        `Payment amount must be exactly ${formatAmount(remainingAmount, club?.currency)}`,
      );
      return;
    }

    // Submit payment to backend
    setIsConfirmingPayment(true);
    try {
      const response = await confirmOrderPayment({
        order_id: selectedOrderForPayment.order_id,
        club_account_id: club?.club_account_id || "",
        transaction_id: selectedOrderForPayment.transaction_id || "",
        payment_amount: amountInCents,
        payment_type: selectedPaymentType,
      });

      if (response.status === 200) {
        toast.success("Payment confirmed successfully");
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === selectedOrderForPayment.order_id
              ? {
                  ...order,
                  payment_status: "PAID",
                  fulfillment_status: "PROCESSING",
                  amount_paid: (order.amount_paid || 0) + amountInCents,
                }
              : order,
          ),
        );
        handleClosePaymentDialog();
      } else {
        toast.error(response.data?.message || "Failed to confirm payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Error confirming payment");
      console.error("Error confirming payment:", err);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentAmount("");
    setSelectedOrderForPayment(null);
    setSelectedPaymentType("");
    setIsPaymentMethodsOpen(false);
  };

  const handleRefundClick = (order: Record<string, unknown>) => {
    setSelectedOrderForRefund(order);
    // Initialize all individual units as unchecked by default
    const orderItems = (order.items as any[]) || [];
    const allUnits = new Set<string>();
    const expandedItems = new Set<string>();
    orderItems.forEach((item: any, idx: number) => {
      expandedItems.add(`${item.product_id}-${idx}`);
    });
    setSelectedItemsForRefund(allUnits);
    setExpandedRefundItems(expandedItems);
    setRefundDialogOpen(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedOrderForRefund) return;

    try {
      setIsProcessingRefund(true);

      // Calculate refund amount based on selected individual units
      const orderItems = (selectedOrderForRefund.items as any[]) || [];
      let refundAmount = 0;
      const selectedItems: any[] = [];

      orderItems.forEach((item: any, idx: number) => {
        const selectedUnits: any[] = [];
        let selectedQuantity = 0;
        for (let i = 0; i < item.quantity; i++) {
          const unitId = `${item.product_id}-${idx}-${i}`;
          if (selectedItemsForRefund.has(unitId)) {
            selectedQuantity++;
            const isDelivered = i < (item.fulfillment_quantity || 0);
            selectedUnits.push({
              is_delivered: isDelivered,
            });
          }
        }

        if (selectedQuantity > 0) {
          const unitPrice = item.price || 0;
          const itemRefundAmount = unitPrice * selectedQuantity;
          refundAmount += itemRefundAmount;
          selectedItems.push({
            ...item,
            quantity: selectedQuantity,
            subtotal: itemRefundAmount,
            units: selectedUnits,
          });
        }
      });

      const totalUnits = orderItems.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      );
      const isFullRefund = selectedItemsForRefund.size === totalUnits;

      const refundPayload = {
        transaction_id: selectedOrderForRefund.transaction_id,
        order_id: selectedOrderForRefund.order_id,
        club_account_id: club?.club_account_id,
        refund_amount: refundAmount,
        is_full_refund: isFullRefund,
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          units: item.units,
        })),
      };

      // Call the refund endpoint
      const response = await refundOrRemoveOrder({
        ...refundPayload,
        club_account_id: club?.club_account_id as string,
      });

      if (response.status === 200) {
        toast.success(
          `Order refunded successfully - ${formatAmount(refundAmount, club?.currency || "ZAR")}`,
        );

        setAllOrders((prevOrders: any) =>
          prevOrders.map((order: any) => {
            if (order.order_id === selectedOrderForRefund.order_id) {
              if (!isFullRefund) {
                return {
                  ...order,
                  payment_status: "PAID (Partial Refund)",
                  amount_paid: (order.amount_paid || 0) - refundAmount,
                };
              }
              return { ...order, payment_status: "REFUNDED" };
            }
            return order;
          }),
        );

        setRefundDialogOpen(false);
        setSelectedOrderForRefund(null);
        setSelectedItemsForRefund(new Set());
        setExpandedRefundItems(new Set());

        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(response.data?.message || "Failed to process refund");
      }
    } catch (err: any) {
      toast.error(err.message || "Error processing refund");
      console.error("Error processing refund:", err);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleDeleteClick = (order: Record<string, unknown>) => {
    setSelectedOrderForDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrderForDelete) return;

    try {
      setIsProcessingDelete(true);

      const orderItems = (selectedOrderForDelete.items as any[]) || [];

      const deletePayload = {
        transaction_id: selectedOrderForDelete.transaction_id,
        order_id: selectedOrderForDelete.order_id,
        club_account_id: club?.club_account_id,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await refundOrRemoveOrder({
        ...deletePayload,
        club_account_id: club?.club_account_id as string,
      });

      if (response.status === 200) {
        toast.success("Order successfully cancelled.");

        setAllOrders((prevOrders: any) =>
          prevOrders.filter(
            (order: any) => order.order_id !== selectedOrderForDelete.order_id,
          ),
        );

        setDeleteDialogOpen(false);
        setSelectedOrderForDelete(null);

        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(response.data?.message || "Failed to delete order");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting order");
      console.error("Error deleting order:", err);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const handleConfirmOrderDelivery = async (orderId: string) => {
    const orderItems = undeliveredItems.filter((u) => u.orderId === orderId);
    if (orderItems.length === 0) return;
    try {
      setIsConfirmingDelivery(true);
      const deliveryItems = orderItems.map((item) => ({
        order_id: item.orderId,
        product_id: item.productId,
      }));
      const response = await updateAdminOrderFulfillment({
        orders: deliveryItems,
        club_account_id: club?.club_account_id || "",
      });
      if (response.status !== 200) {
        throw new Error(response.data?.message || "Failed to confirm delivery");
      }
      toast.success(`Confirmed delivery for ${orderItems.length} item(s)`);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Error confirming delivery");
      console.error("Error confirming delivery:", err);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  return (
    <div className="h-full bg-white text-slate-900 flex flex-col gap-4 px-4 py-6 sm:px-6 md:px-8">
      <div className="mb-2 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-slate-500">Manage your club orders</p>
      </div>

      {!enableShop && (
        <Card className="mb-6 overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm p-0">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-950 sm:text-base">
                  Shop is currently disabled
                </p>
                <p className="max-w-2xl text-sm leading-snug text-amber-800">
                  Enable your shop to make it visible to members and start receiving orders.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/shop/products")}
              className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
            >
              Go to Shop
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="border border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-9 w-full rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 placeholder:text-slate-400 sm:w-[220px]"
            placeholder="Search by Transaction ID"
            value={transactionIdSearch}
            onChange={(e) => setTransactionIdSearch(e.target.value)}
          />

          <Input
            className="h-9 w-full rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 placeholder:text-slate-400 sm:w-[220px]"
            placeholder="Search by Member Name"
            value={memberNameSearch}
            onChange={(e) => setMemberNameSearch(e.target.value)}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-between rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:bg-slate-50 sm:w-[220px]">
                <span className="truncate">{formatFilterLabel("Payment Status", paymentStatusFilter)}</span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Payment Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "PAID (Partial Refund)", label: "Paid (Partial Refund)" },
                { value: "REFUND", label: "Refund" },
                { value: "CANCELLED", label: "Cancelled" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => toggleSelection(option.value, setPaymentStatusFilter)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox checked={paymentStatusFilter.includes(option.value)} className="pointer-events-none h-3.5 w-3.5" />
                  {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setPaymentStatusFilter([])}
              >
                Clear selection
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-between rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:bg-slate-50 sm:w-[220px]">
                <span className="truncate">{formatFilterLabel("Fulfillment Status", fulfillmentStatusFilter)}</span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Fulfillment Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { value: "PROCESSING", label: "Processing" },
                { value: "PARTIALLY_DELIVERED", label: "Partially Delivered" },
                { value: "DELIVERED", label: "Delivered" },
                { value: "NOT_PROCESSED", label: "Not Processed" },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => toggleSelection(option.value, setFulfillmentStatusFilter)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox checked={fulfillmentStatusFilter.includes(option.value)} className="pointer-events-none h-3.5 w-3.5" />
                  {option.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setFulfillmentStatusFilter([])}
              >
                Clear selection
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-500">
              Results per page:
            </label>
            <Select
              value={ordersLimit.toString()}
              onValueChange={(value) => {
                setOrdersLimit(parseInt(value));
                setPageToken(undefined);
                setAllOrders([]);
              }}
            >
              <SelectTrigger className="h-9 w-[85px] rounded-full border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilterChanges && (
            <button
              onClick={() => {
                setAppliedFilters({
                  transaction_id: transactionIdSearch,
                  member_name: memberNameSearch,
                  payment_status: paymentStatusFilter.length ? paymentStatusFilter : undefined,
                  fulfillment_status: fulfillmentStatusFilter.length ? fulfillmentStatusFilter : undefined,
                });
                setPageToken(undefined);
                setAllOrders([]);
              }}
              className="h-9 rounded-full bg-zinc-700 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Apply Filters
            </button>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-500">
        Showing <span className="font-bold text-slate-900">{allOrders.length}</span> orders
      </p>

      {nextPageToken && nextPageToken !== "" && (
        <div className="mb-4 flex items-center justify-between border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <p className="text-sm font-medium">More results available</p>
          </div>
          <Button
            onClick={() => {
              isLoadingMoreRef.current = true;
              setPageToken(nextPageToken);
            }}
            disabled={isLoading}
            variant="outline"
            className="h-8 rounded-full border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 hover:bg-amber-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      <div className="w-full min-w-0 overflow-hidden bg-white">
          <table className="w-full caption-bottom text-sm" style={{ borderCollapse: "separate", borderSpacing: "0 6px", minWidth: "860px" }}>
              <TableHeader className="bg-zinc-700 [&_tr]:border-b [&_tr]:border-zinc-600">
                <TableRow>
                  <TableHead className="h-12 sm:h-14 w-[40px] text-center text-slate-200"></TableHead>
                  <TableHead className="h-12 sm:h-14 w-[140px] text-center text-sm font-semibold text-slate-200">
                    Items
                  </TableHead>
                  <TableHead className="h-12 sm:h-14 w-[160px] text-center text-sm font-semibold text-slate-200">
                    Member
                  </TableHead>
                  <TableHead className="h-12 sm:h-14 w-[140px] text-center text-sm font-semibold text-slate-200">
                    <button onClick={() => handleSort("payment")} className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                      Payment
                      {sortColumn === "payment" ? (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-12 sm:h-14 w-[140px] text-center text-sm font-semibold text-slate-200">
                    <button onClick={() => handleSort("fulfillment")} className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                      Fulfillment
                      {sortColumn === "fulfillment" ? (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-12 sm:h-14 w-[120px] text-center text-sm font-semibold text-slate-200">
                    <button onClick={() => handleSort("date")} className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors">
                      Date
                      {sortColumn === "date" ? (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="h-12 sm:h-14 w-[100px] text-center text-sm font-semibold text-slate-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-slate-50/70">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-red-600"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : allOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => {
                    const memberUserId = getOrderMemberUserId(order);

                    return (
                    <Fragment key={order.order_id}>
                      <TableRow className="h-14 border-0 text-sm hover:bg-white/80">
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.order_id
                                  ? null
                                  : order.order_id,
                              )
                            }
                            className="h-6 w-6 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedOrderId === order.order_id
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="max-w-[160px] text-center text-sm text-slate-700">
                          {(() => {
                            const items = (order.items as { name?: string }[]) ?? [];
                            if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
                            const first = items[0]?.name || "Unknown";
                            const extra = items.length - 1;
                            return (
                              <span className="line-clamp-2 text-xs leading-snug">
                                {first}{extra > 0 && <span className="ml-1 text-muted-foreground">+{extra}</span>}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-700">
                          {memberUserId ? (
                            <Button
                              variant="link"
                              className="h-auto p-0 text-sm font-normal text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                              onClick={() =>
                                navigate(`/manage/members?memberId=${encodeURIComponent(memberUserId)}&returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}&returnLabel=shop`)
                              }
                            >
                              {`${order.first_name} ${order.surname}`}
                            </Button>
                          ) : (
                            `${order.first_name} ${order.surname}`
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <p
                              className={`font-bold ${getOrderPaymentClassName(order)}`}
                            >
                              {getOrderPaymentLabel(order)}
                            </p>
                            {shouldShowOrderPaymentProgress(order) && (
                              <p className="text-xs text-muted-foreground">
                                {formatAmount(
                                  order.amount_paid || 0,
                                  club?.currency,
                                )}{" "}
                                of{" "}
                                {formatAmount(
                                  getOrderEffectiveAmount(order),
                                  club?.currency,
                                )}
                              </p>
                            )}
                            {getOrderRefundedAmount(order) > 0 &&
                            getOrderDisplayPaymentStatus(order) !== "REFUNDED" ? (
                              <div className="space-y-1 text-xs">
                                <p className="text-muted-foreground">
                                  {formatAmount(
                                    getOrderEffectiveAmount(order),
                                    club?.currency,
                                  )}
                                </p>
                                <p className="text-red-800">
                                  Refund: {formatAmount(
                                    getOrderRefundedAmount(order),
                                    club?.currency,
                                  )}
                                </p>
                              </div>
                            ) : getOrderDisplayPaymentStatus(order) ===
                              "REFUNDED" ? (
                              <p className="text-xs text-red-800">
                                Refund: {formatAmount(
                                  getOrderRefundedAmount(order),
                                  club?.currency,
                                )}
                              </p>
                            ) : (
                              shouldShowSingleOrderAmount(order) && (
                                <p className="text-xs text-muted-foreground">
                                  {formatAmount(
                                    getOrderEffectiveAmount(order),
                                    club?.currency,
                                  )}
                                </p>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge
                              className={`${
                                order.fulfillment_status === "DELIVERED"
                                  ? "rounded-full border-green-200 bg-green-100 text-green-800"
                                  : order.fulfillment_status === "PROCESSING"
                                    ? "rounded-full border-purple-200 bg-purple-100 text-purple-800"
                                    : order.fulfillment_status ===
                                        "NOT_PROCESSED"
                                      ? "rounded-full border-orange-200 bg-orange-100 text-orange-800"
                                      : order.fulfillment_status ===
                                            "CANCELLED" ||
                                          order.fulfillment_status ===
                                            "REFUND" ||
                                          order.fulfillment_status ===
                                            "REFUNDED"
                                        ? "rounded-full border-red-200 bg-red-100 text-red-800"
                                        : "rounded-full border-green-200 bg-green-100 text-green-800"
                              }`}
                            >
                              {order.fulfillment_status || "Unknown"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-600">
                          {order.created_date ? (
                            <div className="space-y-0.5">
                              <p>{new Date(order.created_date * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                              <p className="text-muted-foreground">{new Date(order.created_date * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {(getOrderDisplayPaymentStatus(order) === "AWAITING_PAYMENT" ||
                              getOrderDisplayPaymentStatus(order) === "PARTIALLY_PAID") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full border-amber-300 bg-amber-50 px-3 text-xs text-amber-700 hover:bg-amber-100"
                                onClick={() => handlePayNowClick(order)}
                              >
                                Confirm Payment
                              </Button>
                            )}
                            {(order.payment_status === "PAID" || order.payment_status === "PAID (Partial Refund)") &&
                              (order.items as { quantity?: number; fulfillment_quantity?: number }[])?.some(
                                (item) => (item.quantity || 0) - (item.fulfillment_quantity || 0) > 0,
                              ) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full border-purple-200 bg-purple-50 px-3 text-xs text-purple-700 hover:bg-purple-100"
                                onClick={() => handleConfirmOrderDelivery(order.order_id)}
                                disabled={isConfirmingDelivery}
                              >
                                {isConfirmingDelivery ? "Confirming..." : "Confirm Delivery"}
                              </Button>
                            )}
                            {/* Cancel / Refund */}
                            {order.fulfillment_status === "NOT_PROCESSED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full border-slate-200 bg-white px-3 text-xs text-red-600 hover:bg-slate-100"
                                onClick={() => handleDeleteClick(order)}
                              >
                                Cancel
                              </Button>
                            ) : order.payment_status === "PAID" ||
                              (order.amount_paid && order.amount_paid > 0) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full border-slate-200 bg-white px-3 text-xs text-blue-600 hover:bg-slate-100"
                                onClick={() => handleRefundClick(order)}
                              >
                                Refund
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedOrderId === order.order_id && (
                        <TableRow className="border-0 bg-slate-100/60">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">
                                Order Items
                              </h4>
                              {(order.items as any[])?.length > 0 ? (
                                <div className="space-y-2">
                                  {(order.items as any[]).map(
                                    (item: any, idx: number) => (
                                      <div
                                        key={`${item.product_id}-${idx}`}
                                        className={`flex items-center justify-between rounded-xl border bg-white p-3 text-sm ${
                                          order.payment_status === "CANCELLED"
                                            ? "border-red-200 bg-red-50"
                                            : "border-slate-200"
                                        }`}
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium">
                                            {item.name}
                                          </p>
                                          {item.selected_valid_day ? (
                                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-amber-700">
                                              Valid for {item.selected_valid_day}
                                            </p>
                                          ) : null}
                                          <div className="space-y-1 mt-2">
                                            {item.quantity > 0 && (
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`text-xs px-2 py-1 rounded ${
                                                    order.payment_status ===
                                                    "CANCELLED"
                                                      ? "bg-red-100 text-red-700"
                                                      : "bg-blue-50 text-blue-700"
                                                  }`}
                                                >
                                                  Qty: {item.quantity} ×{" "}
                                                  {formatAmount(
                                                    item.price || 0,
                                                    club?.currency,
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                            {item.refund_quantity &&
                                              item.refund_quantity > 0 && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                                                    Refunded:{" "}
                                                    {item.refund_quantity} ×{" "}
                                                    {formatAmount(
                                                      item.price || 0,
                                                      club?.currency,
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                        <div className="flex items-center flex-row gap-2 justify-center px-4">
                                          {item.quantity -
                                            (item.fulfillment_quantity || 0) >
                                            0 && (
                                            <span
                                              className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap bg-orange-50 text-orange-700 border border-orange-200`}
                                            >
                                              {`⏳ Not Received: ${item.quantity - (item.fulfillment_quantity || 0)} / ${item.quantity}`}
                                            </span>
                                          )}
                                          {item.fulfillment_quantity > 0 && (
                                            <span
                                              className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap bg-green-50 text-green-700 border border-green-200`}
                                            >
                                              {`✓ Received: ${item.fulfillment_quantity || 0} / ${item.quantity}`}
                                            </span>
                                          )}
                                        </div>
                                        <p className="font-medium text-right">
                                          {formatAmount(
                                            item.subtotal || 0,
                                            club?.currency,
                                          )}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No items in this order
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                  })
                )}
              </TableBody>
            </table>
      </div>


      <Dialog open={paymentDialogOpen} onOpenChange={handleClosePaymentDialog}>
        <DialogContent className="sm:max-w-[640px] md:max-w-[768px]">
          <DialogHeader>
            <DialogTitle>Process Order Payment</DialogTitle>
            <DialogDescription>
              Review and process the payment for order{" "}
              {selectedOrderForPayment?.order_id?.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForPayment && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border bg-white shadow-sm p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      Order ID:
                    </span>
                    <span className="text-sm font-semibold">
                      {selectedOrderForPayment.order_id
                        ?.substring(0, 8)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">
                      Member Name:
                    </span>
                    <span className="text-sm font-semibold">
                      {selectedOrderForPayment.first_name}{" "}
                      {selectedOrderForPayment.surname}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">
                      Total Amount:
                    </span>
                    <span className="text-sm font-semibold">
                      {formatAmount(
                        selectedOrderForPayment.total_amount || 0,
                        club?.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">
                      Amount Paid:
                    </span>
                    <span className="text-sm font-semibold">
                      {formatAmount(
                        selectedOrderForPayment.amount_paid || 0,
                        club?.currency,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">
                      Remaining Balance:
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      {formatAmount(
                        (selectedOrderForPayment.total_amount || 0) -
                          (selectedOrderForPayment.amount_paid || 0),
                        club?.currency,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount" className="text-sm font-medium">
                  Payment Amount
                </Label>
                <Input
                  id="payment-amount"
                  type="text"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  placeholder="Enter payment amount"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setIsPaymentMethodsOpen(!isPaymentMethodsOpen)
                    }
                    className="flex items-center justify-between w-full py-3 bg-muted/40 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Label className="px-3 text-sm font-semibold mb-0 cursor-pointer">
                      Payment Method
                    </Label>
                    <ChevronDown
                      className={`mx-3 h-4 w-4 transition-transform ${
                        isPaymentMethodsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isPaymentMethodsOpen && (
                    <div className="space-y-2">
                      {paymentMethods && paymentMethods.length > 0 ? (
                        paymentMethods.map((method: any, index: number) => {
                          const methodId =
                            typeof method === "string"
                              ? method
                              : method.name ||
                                method.method_id ||
                                index.toString();
                          const methodName =
                            typeof method === "string"
                              ? method
                              : method.name ||
                                method.method_id ||
                                "Payment Method";
                          const methodDescription =
                            typeof method === "string"
                              ? "Payment option"
                              : method.description || "Payment option";

                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedPaymentType(methodId)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedPaymentType === methodId
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    selectedPaymentType === methodId
                                      ? "border-blue-500 bg-blue-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedPaymentType === methodId && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {methodName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {methodDescription}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 rounded-lg border-2 border-gray-200">
                          <p className="text-sm text-gray-500">
                            No payment methods available
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 flex gap-3 justify-end border-t pt-4">
            <Button
              variant="outline"
              onClick={handleClosePaymentDialog}
              disabled={isConfirmingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirmingPayment}
            >
              {isConfirmingPayment ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
            <DialogDescription>
              Process a partial or full refund for order{" "}
              {selectedOrderForRefund?.transaction_id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-medium">Order Amount:</span>
                <span className="text-sm font-bold">
                  {formatAmount(
                    selectedOrderForRefund?.total_amount || 0,
                    club?.currency,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-medium">Amount Paid:</span>
                <span className="text-sm font-bold">
                  {formatAmount(
                    selectedOrderForRefund?.amount_paid || 0,
                    club?.currency,
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Refund Items</p>
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
                {(selectedOrderForRefund?.items as any[])?.length > 0 ? (
                  (selectedOrderForRefund.items as any[])
                    .map((item: any, idx: number) => {
                      if (item.quantity <= 0) return null;
                      const itemId = `${item.product_id}-${idx}`;
                      const isExpanded = expandedRefundItems.has(itemId);
                      return (
                        <div key={itemId} className="bg-white rounded border">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedRefundItems);
                              if (isExpanded) {
                                newExpanded.delete(itemId);
                              } else {
                                newExpanded.add(itemId);
                              }
                              setExpandedRefundItems(newExpanded);
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Unit Price:{" "}
                                {formatAmount(item.price || 0, club?.currency)}
                              </p>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="space-y-3 border-t p-3">
                              {Array.from({ length: item.quantity }).map(
                                (_, unitIdx) => {
                                  const unitId = `${item.product_id}-${idx}-${unitIdx}`;
                                  return (
                                    <div
                                      key={unitId}
                                      className="space-y-2 pb-2 border-b last:border-b-0 last:pb-0"
                                    >
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selectedItemsForRefund.has(
                                            unitId,
                                          )}
                                          onChange={(e) => {
                                            const newSelected = new Set(
                                              selectedItemsForRefund,
                                            );
                                            if (e.target.checked) {
                                              newSelected.add(unitId);
                                            } else {
                                              newSelected.delete(unitId);
                                            }
                                            setSelectedItemsForRefund(
                                              newSelected,
                                            );
                                          }}
                                          className="rounded flex-shrink-0"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                          Unit {unitIdx + 1} -{" "}
                                          {formatAmount(
                                            item.price || 0,
                                            club?.currency,
                                          )}
                                        </span>
                                        {unitIdx < (item.fulfillment_quantity || 0) ? (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                                            Delivered
                                          </span>
                                        ) : (
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">
                                            Not Delivered
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                    .filter(Boolean)
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No items in this order
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-sm font-medium">
                  Total Refund Amount:
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {formatAmount(
                    Array.from(selectedItemsForRefund).reduce((sum, unitId) => {
                      // Extract item index from unitId format: productId-itemIdx-unitIdx
                      const parts = unitId.split("-");
                      if (parts.length < 3) return sum;
                      const itemIdx = parseInt(parts[parts.length - 2]);
                      const item = (selectedOrderForRefund?.items as any[])?.[
                        itemIdx
                      ];
                      return sum + (item?.price || 0);
                    }, 0),
                    club?.currency,
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              disabled={isProcessingRefund}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessRefund}
              disabled={isProcessingRefund || selectedItemsForRefund.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessingRefund ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Remove Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your order{" "}
              {selectedOrderForDelete?.transaction_id?.substring(0, 8)}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-medium">
                  {selectedOrderForDelete?.order_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {formatAmount(
                    selectedOrderForDelete?.total_amount || 0,
                    club?.currency,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">
                  {`${selectedOrderForDelete?.first_name} ${selectedOrderForDelete?.surname}`}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Order Items</p>
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                {(selectedOrderForDelete?.items as any[])?.length > 0 ? (
                  (selectedOrderForDelete.items as any[]).map(
                    (item: any, idx: number) => (
                      <div
                        key={`${item.product_id}-${idx}`}
                        className="bg-white rounded border p-3 flex items-center justify-between text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.selected_valid_day ? (
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-amber-700">
                              Valid for {item.selected_valid_day}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground mt-1">
                            Qty: {item.quantity} ×{" "}
                            {formatAmount(item.price || 0, club?.currency)}
                          </p>
                        </div>
                        <p className="font-medium text-right">
                          {formatAmount(
                            (item.price || 0) * item.quantity,
                            club?.currency,
                          )}
                        </p>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No items in this order
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              This action cannot be undone. The order will be permanently
              cancelled from the system.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessingDelete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isProcessingDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingDelete ? (
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
