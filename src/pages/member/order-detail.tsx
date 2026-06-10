import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Clock3, CreditCard, Loader2, Package, QrCode, User, X } from "lucide-react";
import QRCode from "react-qr-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";
import { formatTicketDateLabel, ISO_DATE_PATTERN } from "@/lib/shop-valid-days";
import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import { useGetProfileQuery } from "@/queries/profile";
import { getPublicOrder } from "@/services/orders";

type MemberOrderItem = {
  product_id?: string;
  name?: string;
  quantity?: number;
  refund_quantity?: number;
  fulfillment_quantity?: number;
  price?: number;
  subtotal?: number;
  selected_valid_day?: string;
  product_image_url?: string;
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

type LocationState = {
  order?: MemberOrder;
  currency?: string;
};

function getPaymentStatusClassName(status?: string) {
  if (status === "PENDING" || status === "PARTIALLY_PAID") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status?.includes("REFUND") || status === "CANCELLED") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function MemberOrderDetailPage() {
  const { clubId, orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { order: stateOrder, currency: stateCurrency } = (location.state as LocationState) ?? {};

  const auth = useContext(AuthContext) as AuthContextType;
  const { data: profileData } = useGetProfileQuery(auth?.isAdmin ?? false, !!auth?.user);

  const [fetchedOrder, setFetchedOrder] = useState<MemberOrder | null>(null);
  const [fetchedCurrency, setFetchedCurrency] = useState<string>("ZAR");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQr, setShowQr] = useState(false);

  const order = stateOrder ?? fetchedOrder ?? undefined;
  const currency = stateCurrency ?? fetchedCurrency;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!stateOrder && orderId && clubId) {
      setFetchLoading(true);
      getPublicOrder(orderId, clubId)
        .then((data) => {
          setFetchedOrder(data.order ?? data);
          if (data.currency) setFetchedCurrency(data.currency);
        })
        .catch(() => setFetchError(true))
        .finally(() => setFetchLoading(false));
    }
  }, [stateOrder, orderId, clubId]);

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-4 px-4 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <p className="text-lg font-semibold text-slate-900">
            {fetchError ? "Could not load order" : "Order not found"}
          </p>
          <p className="text-sm text-slate-500">
            {fetchError
              ? "There was a problem loading this order. Please try again."
              : "Navigate to this page from your order history."}
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const orderItems: MemberOrderItem[] = Array.isArray(order.items) ? order.items : [];
  const totalItems = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalDelivered = orderItems.reduce((sum, item) => sum + Math.min(Number(item.fulfillment_quantity || 0), Number(item.quantity || 0)), 0);
  const createdDate = order.created_date
    ? new Date(order.created_date * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  const isPendingOrder = order.payment_status === "PENDING";
  const canContinuePayment =
    (order.payment_status === "PENDING" || order.payment_status === "PARTIALLY_PAID") &&
    Boolean(order.order_id);
  const isFulfilled =
    order.fulfillment_status === "FULFILLED" || order.fulfillment_status === "DELIVERED";

  const qrValue = [order.order_id, clubId].filter(Boolean).join("|");

  const currentItem = orderItems[currentIndex];
  const goToPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));
  const goToNext = () => setCurrentIndex((i) => Math.min(i + 1, orderItems.length - 1));

  const deliveredQty = Math.min(
    Number(currentItem?.fulfillment_quantity || 0),
    Number(currentItem?.quantity || 0),
  );
  const refundedQty = Math.min(
    Number(currentItem?.refund_quantity || 0),
    Math.max(Number(currentItem?.quantity || 0) - deliveredQty, 0),
  );
  const pendingQty = Math.max(
    Number(currentItem?.quantity || 0) - deliveredQty - refundedQty,
    0,
  );

  const isCurrentItemExpired = (() => {
    const day = currentItem?.selected_valid_day;
    if (!day) return false;
    let ticketDate: Date;
    if (ISO_DATE_PATTERN.test(day)) {
      const [y, m, d] = day.split("-").map(Number);
      ticketDate = new Date(y, m - 1, d);
    } else {
      const cleaned = day.replace(/\s*\([^)]*\)/, "").trim();
      ticketDate = new Date(cleaned);
      if (isNaN(ticketDate.getTime())) return false;
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return ticketDate < todayStart;
  })();

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Sticky back bar */}
      <div className="sticky top-16 z-20 border-b border-slate-200/60 bg-[#F8F6F3]/90 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-11 px-0 text-sm text-slate-500 hover:bg-transparent hover:text-slate-900"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to orders
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-12 pt-6 sm:px-6 sm:pt-8">

        {/* Privacy warning */}
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Keep this page private.</span> Anyone with this link can view your order and QR code — do not share this URL.
          </p>
        </div>

        {/* Order header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Order summary
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                #{order.order_id?.slice(0, 8).toUpperCase() || "N/A"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {createdDate}
                </span>
                <span>·</span>
                <span>{totalItems} item{totalItems === 1 ? "" : "s"}</span>
              </div>
              {profileData && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">
                    {[profileData.first_name, profileData.surname].filter(Boolean).join(" ")}
                  </span>
                  {profileData.user_id && (
                    <span className="font-mono text-[11px] text-slate-400">
                      #{profileData.user_id.slice(0, 8).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={cn("px-3 py-1 text-sm font-semibold", getPaymentStatusClassName(order.payment_status))}>
                  {order.payment_status || "Unknown"}
                </Badge>
                <Badge className={cn("text-[11px] font-medium text-slate-500", "border-slate-200 bg-slate-100")}>
                  {order.fulfillment_status || "Unknown"}
                </Badge>
              </div>
            </div>

            {/* QR code — tap to expand */}
            <button
              onClick={() => setShowQr(true)}
              className="group flex flex-shrink-0 flex-col items-center gap-1.5"
              aria-label="View QR code"
            >
              <QRCode value={qrValue} size={160} bgColor="transparent" fgColor="#0f172a" />
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-600">
                <QrCode className="h-3 w-3" />
                View
              </span>
            </button>
          </div>

          {/* Fulfilled banner — full width below the header row */}
          {isFulfilled && (
            <div className="mt-4 flex w-full items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Order fulfilled</p>
                <p className="text-xs text-emerald-600">All items have been delivered.</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary tiles — Total | Paid | Delivered */}
        <div className="mb-6 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3.5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
            <p className="mt-1.5 text-base font-semibold text-slate-950">
              {formatAmount(order.total_amount || 0, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3.5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Paid</p>
            <p className="mt-1.5 text-base font-semibold text-slate-950">
              {formatAmount(order.amount_paid || 0, currency)}
            </p>
          </div>
          <div className={cn(
            "rounded-2xl border px-3 py-3.5 shadow-sm",
            isFulfilled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
          )}>
            <p className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              isFulfilled ? "text-emerald-500" : "text-slate-400",
            )}>Delivered</p>
            {isFulfilled ? (
              <div className="mt-1.5 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-semibold text-emerald-800">Yes</p>
              </div>
            ) : (
              <p className="mt-1.5 text-base font-semibold text-slate-950">
                {totalDelivered}/{totalItems}
              </p>
            )}
          </div>
        </div>

        {/* Items carousel */}
        {orderItems.length > 0 ? (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Items — {currentIndex + 1} of {orderItems.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-30"
                  aria-label="Previous item"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex === orderItems.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-30"
                  aria-label="Next item"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Carousel card */}
            <div className={cn(
              "overflow-hidden rounded-3xl border bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.14)]",
              isCurrentItemExpired ? "border-red-200" : "border-slate-200",
            )}>
              <div className="relative flex aspect-[4/3] items-center justify-center bg-stone-100">
                {currentItem?.product_image_url ? (
                  <img
                    src={currentItem.product_image_url}
                    alt={currentItem.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-stone-400" />
                )}
                {isCurrentItemExpired && (
                  <div className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[-30deg] flex items-center justify-center bg-red-600/35 py-2.5 backdrop-blur-sm">
                    <span className="text-sm font-bold uppercase tracking-widest text-white">
                      Expired
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 rounded-full border border-white/40 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {currentIndex + 1} / {orderItems.length}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold leading-tight text-slate-950">
                      {currentItem?.name || "Unnamed item"}
                    </h2>
                    {currentItem?.selected_valid_day ? (
                      <p className={cn(
                        "mt-1 text-xs font-semibold uppercase tracking-[0.14em]",
                        isCurrentItemExpired ? "text-red-600" : "text-amber-700",
                      )}>
                        {isCurrentItemExpired ? "Expired · " : "Valid for "}
                        {formatTicketDateLabel(currentItem.selected_valid_day)}
                      </p>
                    ) : null}
                  </div>
                  <p className="flex-shrink-0 text-lg font-semibold text-slate-950">
                    {formatAmount(currentItem?.subtotal || 0, currency)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quantity</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{currentItem?.quantity || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Unit price</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatAmount(currentItem?.price || 0, currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {deliveredQty > 0 && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Delivered {deliveredQty}
                    </span>
                  )}
                  {pendingQty > 0 && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      Not delivered {pendingQty}
                    </span>
                  )}
                  {refundedQty > 0 && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Refunded {refundedQty}
                    </span>
                  )}
                  {deliveredQty === 0 && pendingQty === 0 && refundedQty === 0 && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                      Awaiting fulfilment
                    </span>
                  )}
                </div>
              </div>

            </div>

            {orderItems.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {orderItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === currentIndex ? "w-5 bg-slate-700" : "w-1.5 bg-slate-300",
                    )}
                    aria-label={`Go to item ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No items in this order.
          </div>
        )}

        {/* Action buttons */}
        {(canContinuePayment || isPendingOrder) && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {canContinuePayment && (
              <Button
                className="flex-1 bg-black text-white hover:bg-slate-900"
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
            )}
            {isPendingOrder && (
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => navigate(-1)}
              >
                Cancel order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* QR code modal */}
      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative mx-4 flex flex-col items-center gap-6 rounded-3xl bg-white px-10 py-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQr(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Order QR code
            </p>
            <QRCode value={qrValue} size={220} bgColor="transparent" fgColor="#0f172a" />
            <p className="font-mono text-sm font-semibold text-slate-700">
              #{order.order_id?.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
