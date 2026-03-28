import { useState, useEffect } from "react";
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
import { ShoppingCart, Package, Minus, Plus, ArrowLeft, CreditCard, AlertTriangle } from "lucide-react";
import { formatAmount } from "@/data/currencies";
import { useFetchClub } from "@/queries/clubs";
import { getClubProducts } from "@/services/shop";
import { createOrder } from "@/services/orders";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
};

export default function MemberShopPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  
  // Fetch club data to check registration status
  const { data: clubData, isLoading: isClubLoading } = useFetchClub(clubId || "");
  
  // Fetch club products from API
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useFetchClubProducts(clubData?.club_account_id || "");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Show loading state while checking registration or loading products
  if (isClubLoading || isProductsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You must be a registered member to access the club shop.
          </p>
          <Button onClick={() => navigate(`/myclubs/${clubId}`)}>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">
            Failed to load shop products. Please try again later.
          </p>
          <Button onClick={() => navigate(`/myclubs/${clubId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Club
          </Button>
        </div>
      </div>
    );
  }

  const availableProducts = (productsData?.products || []).filter(
    (product: any) => product.active_product
  );
  
  const clubCurrency = clubData?.currency || "ZAR";

  const addToCart = (product: any) => {
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
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
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
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
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
      
      // Redirect to view-club page with order id and tab params
      const orderId = response.order_id || response.id;
      const queryParams = new URLSearchParams();
      if (orderId) {
        queryParams.append('orderId', orderId);
      }
      queryParams.append('tab', 'bank');
      queryParams.append('paymentScreen', 'true');

      navigate(`/myclubs/${clubId}?${queryParams.toString()}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create order. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 md:h-16">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/myclubs/${clubId}`)}
                className="flex items-center gap-2 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Club
              </Button>
            </div>
            <Button
              onClick={() => setShowCart(true)}
              className="relative mt-3 md:mt-0"
              variant={cart.length > 0 ? "default" : "outline"}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availableProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h2>
            <p className="text-gray-600">Check back later for new merchandise!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableProducts.map((product: any) => {
              const inCartQuantity = cart.find(item => item.productId === product.product_id)?.quantity || 0;
              
              return (
                <Card key={product.product_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.product_image_url ? (
                      <img 
                        src={product.product_image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {formatAmount(product.price, clubCurrency)}
                        </p>
                      </div>
                      <div className="text-right">
                        {inCartQuantity > 0 && (
                          <p className="text-xs text-orange-600">
                            {inCartQuantity} in cart
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {product.description || "No description available"}
                    </CardDescription>
                    <Button 
                      onClick={() => addToCart(product)} 
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>
              Review your items before placing your order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Your cart is empty</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-2">
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
                
                <div className="flex items-center justify-between font-medium text-lg">
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
        <DialogContent className="max-w-md">
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
                📧 Return to Shop to view your order and pay.
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
    </div>
  );
}