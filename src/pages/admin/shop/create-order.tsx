import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Minus, Package, Plus, Ticket, X } from "lucide-react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubProducts } from "@/queries/admin-features/shop";
import { publicCreateOrder } from "@/services/orders";
import { formatAmount } from "@/data/currencies";
import { formatTicketDateLabel, normalizeTicketValidDayOptions } from "@/lib/shop-valid-days";
import { toast } from "sonner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function shiftMonthKey(monthKey: string, offset: number) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const next = new Date(Date.UTC(year, monthIndex + offset, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatCalendarMonth(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildCalendarDays(monthKey: string) {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const leadingDays = monthStart.getUTCDay();
  const calendarStart = new Date(Date.UTC(year, monthIndex, 1 - leadingDays));
  return Array.from({ length: 42 }, (_, i) => {
    const current = new Date(calendarStart.getTime() + i * 86400000);
    return {
      dateKey: current.toISOString().slice(0, 10),
      dayNumber: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === monthIndex,
    };
  });
}

let _cartCounter = 0;
function genCartId() {
  return `cart-${++_cartCounter}`;
}

interface Product {
  product_id: string;
  name: string;
  price: number;
  active_product: boolean;
  purchase_limit?: string;
  product_type?: string;
  valid_day_start_date?: string;
  valid_day_end_date?: string;
  excluded_valid_day_options?: string[];
  valid_day_options?: string[];
  product_image_url?: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selected_valid_day?: string;
}

export default function CreateOrderPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data: productsData, isLoading: productsLoading } = useFetchClubProducts(
    club?.club_account_id ?? "",
  );

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [calendarMonths, setCalendarMonths] = useState<Record<string, string>>({});
  const [ticketPendingDays, setTicketPendingDays] = useState<Record<string, string>>({});
  const [calendarOpen, setCalendarOpen] = useState<Record<string, boolean>>({});

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [sendAccountEmail, setSendAccountEmail] = useState(true);
  const [sendOrderEmail, setSendOrderEmail] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(true);

  const activeProducts: Product[] = useMemo(
    () => (productsData?.products ?? []).filter((p: Product) => p.active_product),
    [productsData],
  );

  // Non-ticket helpers
  const getNonTicketCartItem = (productId: string) =>
    cart.find((c) => c.product.product_id === productId && !c.product.product_type?.includes("ticket"));

  const setQty = (product: Product, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.product_id !== product.product_id));
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.product_id === product.product_id);
      if (existing) {
        return prev.map((c) =>
          c.product.product_id === product.product_id ? { ...c, quantity: qty } : c,
        );
      }
      return [...prev, { id: genCartId(), product, quantity: qty }];
    });
  };

  // Ticket helpers
  const ticketItemsForProduct = (productId: string) =>
    cart.filter((c) => c.product.product_id === productId);

  const addTicketItem = (product: Product) => {
    const day = ticketPendingDays[product.product_id];
    if (!day) return;
    setCart((prev) => [...prev, { id: genCartId(), product, quantity: 1, selected_valid_day: day }]);
    // Reset pending day after adding
    setTicketPendingDays((prev) => ({ ...prev, [product.product_id]: "" }));
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const totalAmount = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  const validate = (): string | null => {
    if (!email || !email.includes("@") || !email.includes(".")) return "A valid email is required.";
    if (!firstName.trim()) return "First name is required.";
    if (!surname.trim()) return "Surname is required.";
    if (cart.length === 0) return "Add at least one product to the order.";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setShowConfirmDialog(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    try {
      await publicCreateOrder({
        club_account_id: club?.club_account_id,
        email,
        first_name: firstName,
        surname,
        email_opt_in: emailOptIn,
        send_account_email: sendAccountEmail,
        send_order_email: sendOrderEmail,
        items: cart.map((c) => ({
          product_id: c.product.product_id,
          name: c.product.name,
          price: c.product.price,
          quantity: c.quantity,
          subtotal: c.product.price * c.quantity,
          selected_valid_day: c.selected_valid_day,
        })),
        total_amount: totalAmount,
        total_items: totalItems,
      });
      setOrderSuccess(true);
      toast.success("Order created successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to create order. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setFirstName("");
    setSurname("");
    setCart([]);
    setCalendarMonths({});
    setTicketPendingDays({});
    setError(null);
    setOrderSuccess(false);
  };

  if (orderSuccess) {
    return (
      <div className="p-5 max-w-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <div>
            <p className="text-lg font-semibold text-green-900">Order created successfully</p>
            <p className="mt-1 text-sm text-green-700">
              {firstName} {surname} ({email})
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            Create another order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
        <p className="text-muted-foreground">Create an order on behalf of a customer.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left — customer + products */}
        <div className="space-y-6">
          {/* Customer details */}
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold">Customer details</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email *</Label>
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">First name *</Label>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Surname *</Label>
                <Input
                  placeholder="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </Card>

          {/* Product list */}
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold">Products</h2>
            {productsLoading ? (
              <p className="text-sm text-muted-foreground">Loading products…</p>
            ) : activeProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active products found.</p>
            ) : (
              <div className="divide-y">
                {activeProducts.map((product) => {
                  const isTicket = product.product_type === "ticket";
                  const validDays = normalizeTicketValidDayOptions(product);
                  const hasValidDays = validDays.length > 0;

                  if (isTicket) {
                    const addedItems = ticketItemsForProduct(product.product_id);
                    const pendingDay = ticketPendingDays[product.product_id] ?? "";
                    const isCalendarOpen = calendarOpen[product.product_id] ?? false;
                    const validDaySet = new Set(validDays);
                    const minMonth = validDays[0] ? getMonthKey(validDays[0]) : "";
                    const maxMonth = validDays.length ? getMonthKey(validDays[validDays.length - 1]) : "";
                    const activeMonth =
                      calendarMonths[product.product_id] ||
                      (pendingDay ? getMonthKey(pendingDay) : minMonth);
                    const days = activeMonth ? buildCalendarDays(activeMonth) : [];

                    const openCalendar = () =>
                      setCalendarOpen((prev) => ({ ...prev, [product.product_id]: true }));
                    const closeCalendar = () => {
                      setCalendarOpen((prev) => ({ ...prev, [product.product_id]: false }));
                      setTicketPendingDays((prev) => ({ ...prev, [product.product_id]: "" }));
                    };

                    return (
                      <div key={product.product_id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        {/* Header row */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-amber-50 overflow-hidden">
                            {product.product_image_url ? (
                              <img src={product.product_image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Ticket className="h-5 w-5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatAmount(product.price, club?.currency)} · ticket</p>
                          </div>
                        </div>

                        {/* Already-added ticket entries */}
                        {addedItems.length > 0 && (
                          <div className="ml-[52px] space-y-1">
                            {addedItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                                <span className="text-xs text-slate-700">
                                  {item.selected_valid_day
                                    ? formatTicketDateLabel(item.selected_valid_day)
                                    : "No date"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCartItem(item.id)}
                                  disabled={isSubmitting}
                                  className="ml-3 rounded p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Calendar + Add button */}
                        {hasValidDays && (
                          <div className="ml-[52px]">
                            {!isCalendarOpen ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isSubmitting}
                                onClick={openCalendar}
                              >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Select a date to add
                              </Button>
                            ) : (
                              <>
                                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                                  <div className="mb-2 flex items-center justify-between">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-600"
                                      disabled={!activeMonth || activeMonth <= minMonth}
                                      onClick={() =>
                                        setCalendarMonths((prev) => ({
                                          ...prev,
                                          [product.product_id]: shiftMonthKey(activeMonth, -1),
                                        }))
                                      }
                                    >
                                      <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <p className="text-xs font-semibold text-slate-900">
                                      {activeMonth ? formatCalendarMonth(activeMonth) : ""}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-600"
                                        disabled={!activeMonth || activeMonth >= maxMonth}
                                        onClick={() =>
                                          setCalendarMonths((prev) => ({
                                            ...prev,
                                            [product.product_id]: shiftMonthKey(activeMonth, 1),
                                          }))
                                        }
                                      >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-slate-700"
                                        onClick={closeCalendar}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-slate-400">
                                    {WEEKDAYS.map((w) => (
                                      <span key={w} className="py-0.5">{w}</span>
                                    ))}
                                  </div>

                                  <div className="mt-0.5 grid grid-cols-7 gap-0.5">
                                    {days.map((day) => {
                                      const isSelected = day.dateKey === pendingDay;
                                      const isEnabled = validDaySet.has(day.dateKey);
                                      return (
                                        <button
                                          key={day.dateKey}
                                          type="button"
                                          disabled={!isEnabled || isSubmitting}
                                          onClick={() => {
                                            setTicketPendingDays((prev) => ({
                                              ...prev,
                                              [product.product_id]: day.dateKey,
                                            }));
                                            setCalendarOpen((prev) => ({
                                              ...prev,
                                              [product.product_id]: false,
                                            }));
                                          }}
                                          className={cn(
                                            "h-7 rounded-lg text-[11px] font-medium transition",
                                            !day.isCurrentMonth && "text-slate-200",
                                            day.isCurrentMonth && !isEnabled && "text-slate-300",
                                            isEnabled && !isSelected && "bg-slate-50 text-slate-800 hover:bg-slate-100",
                                            isSelected && "bg-slate-900 text-white hover:bg-slate-900",
                                          )}
                                        >
                                          {day.dayNumber}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}

                            {pendingDay && !isCalendarOpen && (
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  disabled={isSubmitting}
                                  onClick={() => addTicketItem(product)}
                                >
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                                  Add — {formatTicketDateLabel(pendingDay)}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTicketPendingDays((prev) => ({
                                      ...prev,
                                      [product.product_id]: "",
                                    }))
                                  }
                                  className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Ticket without valid days — simple add */}
                        {!hasValidDays && (
                          <div className="ml-[52px]">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSubmitting}
                              onClick={() => {
                                setCart((prev) => [
                                  ...prev,
                                  { id: genCartId(), product, quantity: 1 },
                                ]);
                              }}
                            >
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              Add ticket
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Non-ticket product
                  const cartItem = getNonTicketCartItem(product.product_id);
                  const qty = cartItem?.quantity ?? 0;

                  return (
                    <div key={product.product_id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                          {product.product_image_url ? (
                            <img src={product.product_image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatAmount(product.price, club?.currency)}
                            {product.purchase_limit === "single" ? " · single purchase" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={qty === 0 || isSubmitting}
                            onClick={() => setQty(product, qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium tabular-nums">{qty}</span>
                          <button
                            type="button"
                            disabled={isSubmitting || (product.purchase_limit === "single" && qty >= 1)}
                            onClick={() => setQty(product, qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right — order summary + email options */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold">Order summary</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items added yet.</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      {item.selected_valid_day && (
                        <p className="text-xs text-muted-foreground">
                          {formatTicketDateLabel(item.selected_valid_day)}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {item.quantity > 1 ? `${item.quantity} × ` : ""}
                      {formatAmount(item.product.price * item.quantity, club?.currency)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatAmount(totalAmount, club?.currency)}</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold">Email options</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={sendAccountEmail}
                onCheckedChange={(v) => setSendAccountEmail(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Send account creation email</p>
                <p className="text-xs text-muted-foreground">
                  The customer will receive an email with a temporary password to access the Member Portal.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={sendOrderEmail}
                onCheckedChange={(v) => setSendOrderEmail(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Send order confirmation email</p>
                <p className="text-xs text-muted-foreground">
                  The customer will receive an order confirmation with their order details.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={emailOptIn}
                onCheckedChange={(v) => setEmailOptIn(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Email opt-in</p>
                <p className="text-xs text-muted-foreground">
                  The customer will be opted in to receive future emails from the club.
                </p>
              </div>
            </label>
          </Card>

          {error && (
            <Alert variant="destructive" className="flex flex-row py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0}
          >
            Create order
          </Button>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm order</DialogTitle>
            <DialogDescription>
              You are about to create an order for{" "}
              <strong>{firstName} {surname}</strong> totalling{" "}
              <strong>{formatAmount(totalAmount, club?.currency)}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-sm">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.product.name}
                  {item.selected_valid_day ? ` (${formatTicketDateLabel(item.selected_valid_day)})` : ""}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {formatAmount(item.product.price * item.quantity, club?.currency)}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAndSubmit} disabled={isSubmitting}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
