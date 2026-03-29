import { Fragment, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bell,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
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

export default function OrdersPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse URL query params first
  const memberParam = searchParams.get("member");
  const paymentStatusParam = searchParams.get("paymentStatus");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Filtering and pagination - initialize with URL params if present
  const [transactionIdSearch, setTransactionIdSearch] = useState("");
  const [memberNameSearch, setMemberNameSearch] = useState(memberParam || "");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(
    paymentStatusParam ? paymentStatusParam.toUpperCase() : "all",
  );
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState<{
    transaction_id?: string;
    member_name?: string;
    payment_status?: string;
    fulfillment_status?: string;
  }>(() => {
    const filters: {
      transaction_id?: string;
      member_name?: string;
      payment_status?: string;
      fulfillment_status?: string;
    } = {};
    if (memberParam) filters.member_name = memberParam;
    if (paymentStatusParam)
      filters.payment_status = paymentStatusParam.toUpperCase();
    return filters;
  });
  const [ordersLimit, setOrdersLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allOrders, setAllOrders] = useState<any[]>([]);
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
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(
    null,
  );
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
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);
  const [selectedDeliveryItems, setSelectedDeliveryItems] = useState<
    Set<string>
  >(new Set());
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
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
        // Update the order locally instead of refreshing the page
        setAllOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === selectedOrderForPayment.order_id
              ? {
                  ...order,
                  payment_status: "PAID",
                  fulfillment_status: "PROCESSING",
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
        toast.success("Order deleted successfully");

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

  const handleConfirmDelivery = async () => {
    if (selectedDeliveryItems.size === 0) return;

    try {
      setIsConfirmingDelivery(true);

      // Build payload with selected items
      const deliveryItems = Array.from(selectedDeliveryItems)
        .map((itemId) => {
          const item = undeliveredItems.find(
            (u) =>
              `${u.orderId}-${u.productId}-${u.unitIndex}` === itemId ||
              `${u.orderId}-${u.productId}` === itemId,
          );
          if (item) {
            return {
              order_id: item.orderId,
              product_id: item.productId,
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      const response = await updateAdminOrderFulfillment({
        orders: deliveryItems,
        club_account_id: club?.club_account_id || "",
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message || "Failed to confirm delivery");
      }

      toast.success(
        `Confirmed delivery for ${selectedDeliveryItems.size} item(s)`,
      );
      setSelectedDeliveryItems(new Set());

      // Refresh the page to fetch updated orders
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Error confirming delivery");
      console.error("Error confirming delivery:", err);
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage your club orders</p>
      </div>

      {!club?.enable_shop && (
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

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <Input
            className="w-[20%]"
            placeholder="Search by Transaction ID"
            value={transactionIdSearch}
            onChange={(e) => setTransactionIdSearch(e.target.value)}
          />

          <Input
            className="w-[20%]"
            placeholder="Search by Member Name"
            value={memberNameSearch}
            onChange={(e) => setMemberNameSearch(e.target.value)}
          />

          <Select
            onValueChange={setPaymentStatusFilter}
            value={paymentStatusFilter}
          >
            <SelectTrigger className="flex items-center gap-2 w-[20%]">
              <span className="text-muted-foreground whitespace-nowrap">
                Payment Status:
              </span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PAID (Partial Refund)">
                Paid (Partial Refund)
              </SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={setFulfillmentStatusFilter}
            value={fulfillmentStatusFilter}
          >
            <SelectTrigger className="flex items-center gap-2 w-[20%]">
              <span className="text-muted-foreground whitespace-nowrap">
                Fulfillment Status:
              </span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PARTIALLY_DELIVERED">
                Partially Delivered
              </SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="NOT_PROCESSED">Not Processed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-gray-600 my-1">
          Configure your filters above, then click the{" "}
          <span className="font-semibold">Run</span> button to apply your
          selections and display the results.
        </p>
        <button
          onClick={() => {
            setAppliedFilters({
              transaction_id: transactionIdSearch,
              member_name: memberNameSearch,
              payment_status:
                paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
              fulfillment_status:
                fulfillmentStatusFilter !== "all"
                  ? fulfillmentStatusFilter
                  : undefined,
            });
            setPageToken(undefined);
            setAllOrders([]);
          }}
          title="Run database query to refresh orders data"
          className="px-4 py-1 w-[100px] bg-orange-400 hover:bg-orange-500 rounded-[20px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center font-bold"
        >
          Run
        </button>

        <div className="flex items-center gap-3 pt-4 border-t">
          <label className="text-sm font-medium">Results per page:</label>
          <Select
            value={ordersLimit.toString()}
            onValueChange={(value) => {
              setOrdersLimit(parseInt(value));
              setPageToken(undefined);
              setAllOrders([]);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <button
            onClick={() => setShowPendingDropdown(!showPendingDropdown)}
            className="relative p-2 mr-5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Pending deliveries"
          >
            <Bell className="h-6 w-6 text-gray-600" />
            {undeliveredItems.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {undeliveredItems.length}
              </span>
            )}
          </button>
          {showPendingDropdown && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Pending Deliveries ({undeliveredItems.length})
                </h3>
                <div className="flex items-center gap-2">
                  {undeliveredItems.length > 0 && (
                    <Button
                      onClick={handleConfirmDelivery}
                      disabled={
                        selectedDeliveryItems.size === 0 || isConfirmingDelivery
                      }
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      size="sm"
                    >
                      {isConfirmingDelivery ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        `Confirm (${selectedDeliveryItems.size})`
                      )}
                    </Button>
                  )}
                  <button
                    onClick={() => setShowPendingDropdown(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {undeliveredItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  All items delivered!
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {undeliveredItems.map((item, idx) => (
                      <div
                        key={`${item.orderId}-${item.productId}-${idx}`}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedDeliveryItems.has(
                              `${item.orderId}-${item.productId}-${item.unitIndex}`,
                            )}
                            onChange={(e) => {
                              const itemId = `${item.orderId}-${item.productId}-${item.unitIndex}`;
                              const newSelected = new Set(
                                selectedDeliveryItems,
                              );
                              if (e.target.checked) {
                                newSelected.add(itemId);
                              } else {
                                newSelected.delete(itemId);
                              }
                              setSelectedDeliveryItems(newSelected);
                            }}
                            className="mt-1 rounded flex-shrink-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.memberName}
                            </p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-gray-500">
                                Transaction:{" "}
                                <span className="font-mono">
                                  {item.transactionId
                                    ?.substring(0, 8)
                                    .toUpperCase()}
                                </span>
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    item.transactionId,
                                  );
                                  setCopiedTransactionId(item.transactionId);
                                  setTimeout(
                                    () => setCopiedTransactionId(null),
                                    2000,
                                  );
                                }}
                                title="Copy full Transaction ID"
                                className="h-4 w-4 p-0 opacity-75 hover:opacity-100 transition-opacity"
                              >
                                {copiedTransactionId === item.transactionId ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Price:{" "}
                              {formatAmount(
                                item.itemPrice || 0,
                                club?.currency,
                              )}
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 whitespace-nowrap flex-shrink-0">
                            Unit {item.unitIndex}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <h2 className="text-xl font-medium text-gray-700">
          Showing <span className="font-bold">{allOrders.length}</span> items
        </h2>
      </div>

      {nextPageToken && nextPageToken !== "" && (
        <div className="bg-orange-100 W-[100%] border border-orange-600 p-4 rounded-md flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <p className="text-black font-medium">More results available</p>
          </div>
          <button
            onClick={() => {
              isLoadingMoreRef.current = true;
              setPageToken(nextPageToken);
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 cursor-pointer rounded-[20px] border border-black text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      <Card>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center w-[40px]"></TableHead>
                  <TableHead className="text-center w-[140px]">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-center w-[140px]">
                    Member Name
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Amount
                  </TableHead>
                  <TableHead className="text-center w-[140px]">
                    Payment Status
                  </TableHead>
                  <TableHead className="text-center w-[140px]">
                    Fulfillment Status
                  </TableHead>
                  <TableHead className="text-center w-[120px]">Date</TableHead>
                  <TableHead className="text-center w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-red-600"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : allOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  allOrders.map((order) => (
                    <Fragment key={order.order_id}>
                      <TableRow className="h-12">
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
                            className="h-6 w-6 p-0"
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
                        <TableCell className="text-center font-medium text-sm group">
                          {order.transaction_id ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono">
                                {order.transaction_id
                                  .substring(0, 8)
                                  .toUpperCase()}
                                ...
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    order.transaction_id,
                                  );
                                  setCopiedTransactionId(order.transaction_id);
                                  setTimeout(
                                    () => setCopiedTransactionId(null),
                                    2000,
                                  );
                                }}
                                title="Copy full Transaction ID"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {copiedTransactionId ===
                                order.transaction_id ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {`${order.first_name} ${order.surname}`}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {order.payment_status === "PAID (Partial Refund)" ? (
                            <div className="space-y-1">
                              <div className="text-sm line-through text-muted-foreground">
                                {formatAmount(
                                  order.total_amount || 0,
                                  club?.currency,
                                )}
                              </div>
                              <div className="text-sm font-semibold">
                                {formatAmount(
                                  order.amount_paid || 0,
                                  club?.currency,
                                )}
                              </div>
                            </div>
                          ) : (
                            formatAmount(
                              order.total_amount || 0,
                              club?.currency,
                            )
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge
                              className={`${
                                order.payment_status === "PAID" ||
                                order.payment_status === "PAID (Partial Refund)"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : order.payment_status === "PENDING"
                                    ? "bg-orange-100 text-orange-800 border-orange-200 mt-2"
                                    : order.payment_status === "PARTIALLY_PAID"
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : order.payment_status === "CANCELLED" ||
                                          order.payment_status === "REFUND"
                                        ? "bg-red-100 text-red-800 border-red-200"
                                        : "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                            >
                              {order.payment_status || "Unknown"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge
                              className={`${
                                order.fulfillment_status === "DELIVERED"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : order.fulfillment_status === "PROCESSING"
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : order.fulfillment_status ===
                                        "NOT_PROCESSED"
                                      ? "bg-orange-100 text-orange-800 border-orange-200"
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
                              {order.fulfillment_status || "Unknown"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {order.created_date
                            ? new Date(
                                order.created_date * 1000,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            {(order.payment_status === "PENDING" ||
                              order.payment_status === "PARTIALLY_PAID") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayNowClick(order)}
                                className="text-xs h-7 text-red-600"
                              >
                                Confirm Payment
                              </Button>
                            )}
                            {order.fulfillment_status === "NOT_PROCESSED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 text-red-600"
                                onClick={() => handleDeleteClick(order)}
                              >
                                Cancel
                              </Button>
                            ) : order.payment_status === "PAID" ||
                              (order.amount_paid && order.amount_paid > 0) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 text-blue-600"
                                onClick={() => handleRefundClick(order)}
                              >
                                Refund
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                N/A
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedOrderId === order.order_id && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={9} className="p-4">
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
                                        className={`bg-white rounded p-3 border flex items-center justify-between text-sm ${
                                          order.payment_status === "CANCELLED"
                                            ? "border-red-200 bg-red-50"
                                            : ""
                                        }`}
                                      >
                                        <div className="flex-1">
                                          <p className="font-medium">
                                            {item.name}
                                          </p>
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      {/* Cancel Order Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order{" "}
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
                "Cancel Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
