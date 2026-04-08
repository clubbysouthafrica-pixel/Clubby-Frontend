import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Search, ShoppingBag, ArrowUp, ArrowDown } from "lucide-react";
import { Fragment } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { formatAmount } from "@/data/currencies";

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
  created_date?: number;
  payment_status?: string;
  fulfillment_status?: string;
  total_amount?: number;
  amount_paid?: number;
  items?: MemberOrderItem[];
};

type ClubShopTabProps = {
  enabled: boolean;
  currency?: string;
  orderSearch: string;
  setOrderSearch: (value: string) => void;
  orderSortColumn: "date" | "payment_status" | "fulfillment_status" | "total" | null;
  orderSortDirection: "asc" | "desc";
  onOrderSort: (column: "date" | "payment_status" | "fulfillment_status" | "total") => void;
  isOrdersLoading: boolean;
  ordersError: unknown;
  memberOrderList: MemberOrder[];
  sortedOrders: MemberOrder[];
  expandedRows: Record<string, boolean>;
  onToggleRow: (orderId: string) => void;
  onOpenStore: () => void;
  onOrderPayNow: (orderId?: string) => void;
  getOrderPaymentBadgeClassName: (status?: string) => string;
  getOrderFulfillmentBadgeClassName: (status?: string) => string;
  getRefundedAmount: (order: MemberOrder) => number;
};

export function ClubShopTab({
  enabled,
  currency,
  orderSearch,
  setOrderSearch,
  orderSortColumn,
  orderSortDirection,
  onOrderSort,
  isOrdersLoading,
  ordersError,
  memberOrderList,
  sortedOrders,
  expandedRows,
  onToggleRow,
  onOpenStore,
  onOrderPayNow,
  getOrderPaymentBadgeClassName,
  getOrderFulfillmentBadgeClassName,
  getRefundedAmount,
}: ClubShopTabProps) {
  const hasOrdersError = Boolean(ordersError);

  if (!enabled) {
    return null;
  }

  return (
    <TabsContent value="shop" className="mt-0">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">My Orders</CardTitle>
                  <CardDescription className="text-base">
                    View your order history and shop for new items
                  </CardDescription>
                </div>
              </div>
              <Button onClick={onOpenStore} className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Go to Shop
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-primary/10 p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Search by order ID, item, payment status, fulfillment status, or amount"
                  className="pl-9"
                />
              </div>
            </div>
            <div className={sortedOrders.length > 5 ? "max-h-96 overflow-y-auto" : "overflow-hidden"}>
              <Table className="border-0">
                <TableHeader className="sticky top-0 z-10 bg-muted/40">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="w-12 text-center"></TableHead>
                    <TableHead className="text-center flex-1 font-semibold">Order #</TableHead>
                    <TableHead className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOrderSort("date")}>
                      <div className="flex items-center justify-center gap-2">
                        Date
                        {orderSortColumn === "date" && (orderSortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOrderSort("total")}>
                      <div className="flex items-center justify-center gap-2">
                        Total
                        {orderSortColumn === "total" && (orderSortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-center flex-1 font-semibold">Amount Paid</TableHead>
                    <TableHead className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOrderSort("payment_status")}>
                      <div className="flex items-center justify-center gap-2">
                        Payment Status
                        {orderSortColumn === "payment_status" && (orderSortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-center flex-1 font-semibold cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onOrderSort("fulfillment_status")}>
                      <div className="flex items-center justify-center gap-2">
                        Fulfillment Status
                        {orderSortColumn === "fulfillment_status" && (orderSortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isOrdersLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        <p className="mt-2 text-muted-foreground">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {hasOrdersError && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-red-600">
                        Failed to load orders. Please try again later.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isOrdersLoading && !hasOrdersError && memberOrderList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No orders yet. Start shopping to see your orders here!
                      </TableCell>
                    </TableRow>
                  )}
                  {!isOrdersLoading && !hasOrdersError && memberOrderList.length > 0 && sortedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No orders match your search.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isOrdersLoading && !hasOrdersError && sortedOrders.map((order) => {
                    const orderItems = Array.isArray(order.items)
                      ? order.items.filter((item) => Number(item.quantity || 0) > 0)
                      : [];
                    const refundedAmount = getRefundedAmount(order);

                    return (
                      <Fragment key={order.order_id}>
                        <TableRow className="group border-primary/10 transition-colors hover:bg-primary/5">
                          <TableCell className="w-12 py-4 text-center">
                            <Button variant="ghost" size="sm" onClick={() => onToggleRow(order.order_id || "")} className="h-8 w-8 p-0" disabled={!order.order_id}>
                              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedRows[order.order_id || ""] && "rotate-180")} />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4">
                            <span className="rounded bg-muted/50 px-2 py-1 font-mono text-sm">#{order.order_id?.slice(0, 8) || "N/A"}</span>
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4">
                            {order.created_date ? new Date(order.created_date * 1000).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4 font-semibold">
                            {order.payment_status === "PAID (Partial Refund)" && refundedAmount > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground line-through">{formatAmount(order.total_amount || 0, currency)}</div>
                                <div>{formatAmount(order.amount_paid || 0, currency)}</div>
                              </div>
                            ) : (
                              formatAmount(order.total_amount || 0, currency)
                            )}
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4 font-semibold">
                            {formatAmount(order.amount_paid || 0, currency)}
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <Badge className={cn("font-medium", getOrderPaymentBadgeClassName(order.payment_status))}>
                                {order.payment_status || "Unknown"}
                              </Badge>
                              {(order.payment_status === "PENDING" || order.payment_status === "PARTIALLY_PAID") && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600 underline" onClick={() => onOrderPayNow(order.order_id)}>
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center flex-1 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Badge className={cn("font-medium", getOrderFulfillmentBadgeClassName(order.fulfillment_status))}>
                                {order.fulfillment_status || "Unknown"}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows[order.order_id || ""] && (
                          <TableRow className="border-primary/10 bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={8} className="p-4">
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">Order Items</h4>
                                  {orderItems.length > 0 ? (
                                    <div className="space-y-2">
                                      {orderItems.map((item, index) => {
                                        const quantity = Number(item.quantity || 0);
                                        const refundQuantity = Number(item.refund_quantity || 0);
                                        const fulfillmentQuantity = Number(item.fulfillment_quantity || 0);
                                        const outstandingQuantity = Math.max(quantity - fulfillmentQuantity, 0);
                                        const refundedSubtotal = refundQuantity * Number(item.price || 0);

                                        return (
                                          <div key={`${item.product_id || item.name || "item"}-${index}-expanded`} className="rounded-lg border border-primary/10 bg-background px-4 py-3">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                              <div className="space-y-2">
                                                <p className="text-sm font-medium">{item.name || "Unnamed item"}</p>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                  <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Qty: {quantity} x {formatAmount(item.price || 0, currency)}</span>
                                                  {refundQuantity > 0 && <span className="rounded bg-red-50 px-2 py-1 text-red-700">Refunded: {refundQuantity} x {formatAmount(item.price || 0, currency)}</span>}
                                                  {fulfillmentQuantity > 0 && <span className="rounded border border-green-200 bg-green-50 px-2 py-1 text-green-700">Received: {fulfillmentQuantity} / {quantity}</span>}
                                                  {outstandingQuantity > 0 && <span className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700">Not Received: {outstandingQuantity} / {quantity}</span>}
                                                </div>
                                              </div>
                                              <div className="space-y-1 text-left lg:text-right">
                                                <p className="text-sm font-semibold">{formatAmount(item.subtotal || 0, currency)}</p>
                                                {refundQuantity > 0 && <p className="text-xs text-red-700">Refunded total: {formatAmount(refundedSubtotal, currency)}</p>}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-dashed border-primary/20 bg-background px-4 py-6 text-sm text-muted-foreground">
                                      No order items are available for this order.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}