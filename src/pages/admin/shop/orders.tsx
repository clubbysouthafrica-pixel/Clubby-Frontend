
import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Clock, CheckCircle, Package, ChevronDown, Copy, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
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
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { getClubOrders, confirmOrderPayment } from "@/services/admin/orders";
import { updateAdminOrderFulfillment } from "@/requests/admin-orders-request";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrdersPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    shipping: 0,
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(null);
  const [fulfillmentDialogOpen, setFulfillmentDialogOpen] = useState(false);
  const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState<any>(null);
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!club?.club_account_id) return;
      
      try {
        setIsLoading(true);
        const response = await getClubOrders(club.club_account_id);
        
        if (response.status === 200 && response.data?.orders) {
          setOrders(response.data.orders);
          setPaymentMethods(response.data.payment_methods || []);
          
          // Calculate stats
          const totalOrders = response.data.orders.length;
          const pendingOrders = response.data.orders.filter((o: any) => o.payment_status === "PENDING").length;
          const completedOrders = response.data.orders.filter((o: any) => o.fulfillment_status === "DELIVERED").length;
          const shippingOrders = response.data.orders.filter((o: any) => o.fulfillment_status === "PROCESSING").length;
          
          setStats({
            total: totalOrders,
            pending: pendingOrders,
            completed: completedOrders,
            shipping: shippingOrders,
          });
        }
      } catch (err: any) {
        setError("Failed to load orders");
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [club?.club_account_id]);

  const handlePayNowClick = (order: Record<string, unknown>) => {
    setSelectedOrderForPayment(order);
    setPaymentAmount(formatAmount(0, club?.currency));
    if (paymentMethods && paymentMethods.length > 0) {
      const firstMethod = paymentMethods[0];
      const methodId = typeof firstMethod === 'string' ? firstMethod : (firstMethod as Record<string, unknown>).name || (firstMethod as Record<string, unknown>).method_id || '0';
      setSelectedPaymentType(String(methodId));
    }
    setPaymentDialogOpen(true);
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const remainingAmount = (selectedOrderForPayment.total_amount || 0) - (selectedOrderForPayment.amount_paid || 0);
    
    // Validate payment amount
    if (amountInCents <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }
    
    if (amountInCents > remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatAmount(remainingAmount, club?.currency)}`);
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
        // Refetch orders
        if (club?.club_account_id) {
          const ordersResponse = await getClubOrders(club.club_account_id);
          if (ordersResponse.status === 200 && ordersResponse.data?.orders) {
            setOrders(ordersResponse.data.orders);
          }
        }
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

  const handleFulfillmentStatusClick = (order: any) => {
    setSelectedOrderForFulfillment(order);
    setFulfillmentDialogOpen(true);
  };

  const handleConfirmFulfillmentUpdate = async () => {
    if (!selectedOrderForFulfillment || !club?.club_account_id) return;

    try {
      setIsUpdatingFulfillment(true);
      const response = await updateAdminOrderFulfillment(
        club.club_account_id,
        selectedOrderForFulfillment.order_id
      );

      // Check if status is 200 and response has a message
      if (response && response.status === 200 && response.message) {
        toast.success("Fulfillment status updated successfully");
        
        // Update local state immediately
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.order_id === selectedOrderForFulfillment.order_id
              ? { ...order, fulfillment_status: "DELIVERED" }
              : order
          )
        );
        
        setFulfillmentDialogOpen(false);
        setSelectedOrderForFulfillment(null);
      } else {
        toast.error(response?.message || "Failed to update fulfillment status");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating fulfillment status");
      console.error("Error updating fulfillment status:", err);
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Track and manage customer orders and fulfillment.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipping}</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Manage and track all customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center w-[140px]">Transaction ID</TableHead>
                  <TableHead className="text-center w-[140px]">Member Name</TableHead>
                  <TableHead className="text-center w-[120px]">Amount</TableHead>
                  <TableHead className="text-center w-[120px]">Amount Paid</TableHead>
                  <TableHead className="text-center w-[140px]">Payment Status</TableHead>
                  <TableHead className="text-center w-[140px]">Fulfillment Status</TableHead>
                  <TableHead className="text-center w-[120px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.order_id} className="h-12">
                      <TableCell className="text-center font-medium text-sm group">
                        {order.transaction_id ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono">
                              {order.transaction_id.substring(0, 8).toUpperCase()}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(order.transaction_id);
                                setCopiedTransactionId(order.transaction_id);
                                setTimeout(() => setCopiedTransactionId(null), 2000);
                              }}
                              title="Copy full Transaction ID"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedTransactionId === order.transaction_id ? (
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
                        {formatAmount(order.total_amount || 0, club?.currency)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatAmount(order.amount_paid || 0, club?.currency)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Badge
                            className={`${
                              order.payment_status === "PAID"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : order.payment_status === "PENDING"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : order.payment_status === "PARTIALLY_PAID"
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {order.payment_status || "Unknown"}
                          </Badge>
                          {(order.payment_status === "PENDING" || order.payment_status === "PARTIALLY_PAID") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayNowClick(order)}
                              className="text-xs h-7 text-red-600 border-0 shadow-none"
                            >
                              Confirm Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            onClick={() =>
                              order.fulfillment_status === "PROCESSING" &&
                              handleFulfillmentStatusClick(order)
                            }
                            className={`${
                              order.fulfillment_status === "DELIVERED"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : order.fulfillment_status === "PROCESSING"
                                  ? "bg-purple-100 text-purple-800 border-purple-200 cursor-pointer hover:opacity-80"
                                  : order.fulfillment_status === "NOT_PROCESSED"
                                    ? "bg-orange-100 text-orange-800 border-orange-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            {order.fulfillment_status || "Unknown"}
                          </Badge>
                          {order.fulfillment_status === "PROCESSING" && (
                            <div className="relative group">
                              <AlertTriangle className="w-4 h-4 text-purple-600 cursor-help" />
                              <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 bottom-full mb-2 right-0">
                                Click to update status
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {order.created_date
                          ? new Date(order.created_date * 1000).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "short", day: "numeric" },
                            )
                          : "N/A"}
                      </TableCell>
                    </TableRow>
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
              Review and process the payment for order {selectedOrderForPayment?.order_id?.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForPayment && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border bg-white shadow-sm p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Order ID:</span>
                    <span className="text-sm font-semibold">
                      {selectedOrderForPayment.order_id?.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">Member Name:</span>
                    <span className="text-sm font-semibold">
                      {selectedOrderForPayment.first_name} {selectedOrderForPayment.surname}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                    <span className="text-sm font-semibold">
                      {formatAmount(selectedOrderForPayment.total_amount || 0, club?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">Amount Paid:</span>
                    <span className="text-sm font-semibold">
                      {formatAmount(selectedOrderForPayment.amount_paid || 0, club?.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">Remaining Balance:</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {formatAmount((selectedOrderForPayment.total_amount || 0) - (selectedOrderForPayment.amount_paid || 0), club?.currency)}
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
                          const methodId = typeof method === 'string' ? method : method.name || method.method_id || index.toString();
                          const methodName = typeof method === 'string' ? method : method.name || method.method_id || 'Payment Method';
                          const methodDescription = typeof method === 'string' ? 'Payment option' : method.description || 'Payment option';
                          
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
                                  <p className="font-medium text-sm">{methodName}</p>
                                  <p className="text-xs text-gray-500">{methodDescription}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 rounded-lg border-2 border-gray-200">
                          <p className="text-sm text-gray-500">No payment methods available</p>
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

      <Dialog open={fulfillmentDialogOpen} onOpenChange={setFulfillmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this order as delivered? This action will update the fulfillment status to DELIVERED and this order will be considered complete.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setFulfillmentDialogOpen(false)}
              disabled={isUpdatingFulfillment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFulfillmentUpdate}
              disabled={isUpdatingFulfillment}
            >
              {isUpdatingFulfillment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}