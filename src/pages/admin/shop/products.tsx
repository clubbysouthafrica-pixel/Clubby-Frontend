import React, { useState, useContext, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, ChevronsUpDown, ImageIcon, AlertCircle, Loader2, Settings, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { formatAmount } from "@/data/currencies";
import { addProduct, AddProductRequest, updateProduct, UpdateProductRequest } from "@/services/admin-features/shop";
import { updateClubDetails } from "@/services/admin/club";
import { toast } from "sonner";
import { useFetchClubProducts } from "@/queries/admin-features/shop";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildValidDayOptionsFromDateRange,
  emptyTicketDateConfig,
  formatTicketDateSummary,
  normalizeTicketDateConfig,
  normalizeTicketValidDayOptions,
  type TicketDateConfig,
} from "@/lib/shop-valid-days";

type AdminClubSummary = {
  club_account_id: string;
  enable_shop?: boolean;
  public_shop?: boolean;
} & Record<string, unknown>;

type AdminClubsQueryData = {
  data?: {
    items?: AdminClubSummary[];
  };
} & Record<string, unknown>;

type ClubQueryData = {
  enable_shop?: boolean;
  public_shop?: boolean;
} & Record<string, unknown>;

type ShopVisibilityUpdates = {
  enable_shop?: boolean;
  public_shop?: boolean;
};

type ProductRecord = {
  id: string | number;
  name: string;
  price: number;
  quantityLeft: number;
  isActive: boolean;
  createdAt: number;
  description?: string;
  allowMultiple: boolean;
  productType: "standard" | "ticket";
  ticketDateConfig: TicketDateConfig;
  validDayOptions: string[];
  image?: string;
  autoDeliver?: boolean;
};

type RawProductRecord = {
  product_id: string | number;
  name: string;
  price: number;
  initial_quantity: number;
  active_product: boolean;
  created_date: number;
  description?: string;
  purchase_limit?: string;
  product_type?: "standard" | "ticket" | string;
  valid_day_start_date?: string;
  valid_day_end_date?: string;
  excluded_valid_day_options?: string[];
  valid_day_options?: string[];
  product_image_url?: string;
  auto_deliver?: boolean;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function ProductsPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const queryClient = useQueryClient();
  const { data: productsData, isLoading: productsLoading, error: productsError } = useFetchClubProducts(club?.club_account_id || "");

  const syncShopSettingsState = (updates: ShopVisibilityUpdates) => {
    if (!club) return;

    setClub({ ...club, ...updates });

    queryClient.setQueryData(["adminClubs"], (previous: AdminClubsQueryData | undefined) => {
      const items = previous?.data?.items;
      if (!Array.isArray(items)) return previous;

      return {
        ...previous,
        data: {
          ...(previous?.data ?? {}),
          items: items.map((item) =>
            item.club_account_id === club.club_account_id
              ? { ...item, ...updates }
              : item,
          ),
        },
      };
    });

    queryClient.setQueriesData(
      { queryKey: ["getClub", club.club_account_id] },
      (previous: ClubQueryData | undefined) =>
        previous ? { ...previous, ...updates } : previous,
    );
  };
  
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [originalProducts, setOriginalProducts] = useState<ProductRecord[]>([]);
  const [nameSortAsc, setNameSortAsc] = useState<boolean | null>(null);
  const [priceSortAsc, setPriceSortAsc] = useState<boolean | null>(null);
  const [quantitySortAsc, setQuantitySortAsc] = useState<boolean | null>(null);
  const [createdAtSortAsc, setCreatedAtSortAsc] = useState<boolean | null>(null);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | number | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editQuantityLeft, setEditQuantityLeft] = useState("0");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editProductType, setEditProductType] = useState<"standard" | "ticket">("standard");
  const [editTicketDateConfig, setEditTicketDateConfig] = useState<TicketDateConfig>(emptyTicketDateConfig);
  const [editProductImage, setEditProductImage] = useState<string>("");
  const [editAutoDeliver, setEditAutoDeliver] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // Form state
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [productType, setProductType] = useState<"standard" | "ticket">("standard");
  const [ticketDateConfig, setTicketDateConfig] = useState<TicketDateConfig>(emptyTicketDateConfig);
  const [productImage, setProductImage] = useState<string>("");
  const [autoDeliver, setAutoDeliver] = useState(false);
  const [isEnablingShop, setIsEnablingShop] = useState(false);
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [isTogglingPublicShop, setIsTogglingPublicShop] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);

  // Sync API data with local state
  useEffect(() => {
    if (productsData?.products) {
      const formattedProducts: ProductRecord[] = productsData.products.map((product: RawProductRecord) => {
        const ticketDateConfig = normalizeTicketDateConfig(product);

        return {
          id: product.product_id,
          name: product.name,
          price: product.price / 100, // Convert from cents to dollars for display
          quantityLeft: product.initial_quantity,
          isActive: product.active_product,
          createdAt: product.created_date,
          description: product.description,
          allowMultiple: product.purchase_limit === "multiple",
          productType: product.product_type === "ticket" ? "ticket" : "standard",
          ticketDateConfig,
          validDayOptions: normalizeTicketValidDayOptions(product),
          image: product?.product_image_url ?? undefined,
          autoDeliver: product.auto_deliver ?? false,
        };
      });
      setProducts(formattedProducts);
      setOriginalProducts(JSON.parse(JSON.stringify(formattedProducts)));
    }
  }, [productsData]);

  const formatDate = (epoch: number) => {
    return new Date(epoch * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setProductName("");
    setPrice("");
    setPriceDisplay("");
    setDescription("");
    setIsActive(false);
    setAllowMultiple(true);
    setProductType("standard");
    setTicketDateConfig(emptyTicketDateConfig());
    setProductImage("");
    setAutoDeliver(false);
  };

  const resetEditForm = () => {
    setEditingProductId(null);
    setEditProductName("");
    setEditQuantityLeft("0");
    setEditIsActive(false);
    setEditProductType("standard");
    setEditTicketDateConfig(emptyTicketDateConfig());
    setEditProductImage("");
    setEditAutoDeliver(false);
    setIsSavingProduct(false);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d]/g, "");
    const numeric = parseInt(cleaned || "0", 10);
    setPrice((numeric / 100).toString());
    setPriceDisplay(formatAmount(numeric, club?.currency));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!productName || !club?.club_account_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    const ticketDateResult =
      productType === "ticket"
        ? buildValidDayOptionsFromDateRange(
            ticketDateConfig.startDate,
            ticketDateConfig.endDate,
            ticketDateConfig.excludedDates,
          )
        : { options: [] as string[] };

    if (productType === "ticket" && ticketDateResult.error) {
      toast.error(ticketDateResult.error);
      return;
    }

    try {
      const productRequest: AddProductRequest = {
        club_account_id: club.club_account_id,
        name: productName,
        price: parseFloat(price || "0") * 100, // Convert to cents as expected by backend
        active_product: isActive,
        purchase_limit: allowMultiple ? "multiple" : "single",
        product_type: productType,
        valid_day_start_date:
          productType === "ticket" ? ticketDateConfig.startDate : undefined,
        valid_day_end_date:
          productType === "ticket" ? ticketDateConfig.endDate : undefined,
        excluded_valid_day_options:
          productType === "ticket"
            ? ticketDateConfig.excludedDates
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean)
            : undefined,
        description: description || undefined,
        auto_deliver: autoDeliver,
        ...(productImage && { product_image: productImage }),
      };

      const response = await addProduct(productRequest);
      
      // Add the new product to the local state for immediate UI update
      const newProduct: ProductRecord = {
        id: response.product_id || products.length + 1,
        name: productName,
        price: parseFloat(price || "0"),
        quantityLeft: 0,
        isActive,
        createdAt: Math.floor(Date.now() / 1000), // Current epoch time
        description,
        allowMultiple,
        productType,
        ticketDateConfig:
          productType === "ticket"
            ? {
                ...ticketDateConfig,
                excludedDates: ticketDateConfig.excludedDates
                  .split("\n")
                  .map((value) => value.trim())
                  .filter(Boolean)
                  .join("\n"),
              }
            : emptyTicketDateConfig(),
        validDayOptions: productType === "ticket" ? ticketDateResult.options : [],
        autoDeliver,
      };

      setProducts(prev => [...prev, newProduct]);
      toast.success(`Product "${productName}" added successfully!`);
      
      // Invalidate and refetch products query
      queryClient.invalidateQueries({ queryKey: ['clubProducts', club.club_account_id] });
      
      resetForm();
      setOpenDialog(false);
    } catch (error: unknown) {
      console.error('Error adding product:', error);
      const errorMessage = getErrorMessage(error, "Failed to add product. Please try again.");
      toast.error(errorMessage);
    }
  };

  const sortedProducts = React.useMemo(() => {
    const sortedCopy = [...products];

    if (nameSortAsc !== null) {
      sortedCopy.sort((a, b) => {
        return nameSortAsc 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    } else if (priceSortAsc !== null) {
      sortedCopy.sort((a, b) => {
        return priceSortAsc ? a.price - b.price : b.price - a.price;
      });
    } else if (quantitySortAsc !== null) {
      sortedCopy.sort((a, b) => {
        return quantitySortAsc ? a.quantityLeft - b.quantityLeft : b.quantityLeft - a.quantityLeft;
      });
    } else if (createdAtSortAsc !== null) {
      sortedCopy.sort((a, b) => {
        return createdAtSortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      });
    }

    return sortedCopy;
  }, [products, nameSortAsc, priceSortAsc, quantitySortAsc, createdAtSortAsc]);

  const handleSort = (column: 'name' | 'price' | 'quantity' | 'createdAt') => {
    if (column === 'name') {
      setNameSortAsc(nameSortAsc === null ? true : !nameSortAsc);
      setPriceSortAsc(null);
      setQuantitySortAsc(null);
      setCreatedAtSortAsc(null);
    } else if (column === 'price') {
      setPriceSortAsc(priceSortAsc === null ? true : !priceSortAsc);
      setNameSortAsc(null);
      setQuantitySortAsc(null);
      setCreatedAtSortAsc(null);
    } else if (column === 'quantity') {
      setQuantitySortAsc(quantitySortAsc === null ? true : !quantitySortAsc);
      setNameSortAsc(null);
      setPriceSortAsc(null);
      setCreatedAtSortAsc(null);
    } else if (column === 'createdAt') {
      setCreatedAtSortAsc(createdAtSortAsc === null ? true : !createdAtSortAsc);
      setNameSortAsc(null);
      setPriceSortAsc(null);
      setQuantitySortAsc(null);
    }
  };

  const handleEditProduct = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setEditProductName(product.name);
    setEditQuantityLeft(String(product.quantityLeft));
    setEditIsActive(product.isActive);
    setEditProductType(product.productType);
    setEditTicketDateConfig(product.ticketDateConfig);
    setEditProductImage(product.image ?? "");
    setEditAutoDeliver(product.autoDeliver ?? false);
    setEditDialogOpen(true);
  };

  const handleEditProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditProductImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (editingProductId === null || !club?.club_account_id) return;

    const product = products.find((item) => item.id === editingProductId);
    const originalProduct = originalProducts.find((item) => item.id === editingProductId);
    if (!product) return;

    const parsedQuantity = Number.parseInt(editQuantityLeft, 10);
    const editTicketDateResult =
      editProductType === "ticket"
        ? buildValidDayOptionsFromDateRange(
            editTicketDateConfig.startDate,
            editTicketDateConfig.endDate,
            editTicketDateConfig.excludedDates,
          )
        : { options: [] as string[] };

    if (!editProductName.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      toast.error("Quantity must be zero or more.");
      return;
    }

    if (editProductType === "ticket" && editTicketDateResult.error) {
      toast.error(editTicketDateResult.error);
      return;
    }

    try {
      setIsSavingProduct(true);
      const updateRequest: UpdateProductRequest = {
        product_id: editingProductId.toString(),
        club_account_id: club.club_account_id,
        name: editProductName.trim(),
        initial_quantity: parsedQuantity,
        active_product: editIsActive,
        product_type: editProductType,
        valid_day_start_date:
          editProductType === "ticket" ? editTicketDateConfig.startDate : undefined,
        valid_day_end_date:
          editProductType === "ticket" ? editTicketDateConfig.endDate : undefined,
        excluded_valid_day_options:
          editProductType === "ticket"
            ? editTicketDateConfig.excludedDates
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean)
            : [],
        auto_deliver: editAutoDeliver,
      };

      // Only include product_image if it has changed
      if (originalProduct && editProductImage !== (originalProduct.image ?? "")) {
        updateRequest.product_image = editProductImage;
      }

      await updateProduct(updateRequest);

      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProductId
            ? {
                ...item,
                name: editProductName.trim(),
                quantityLeft: parsedQuantity,
                isActive: editIsActive,
                productType: editProductType,
                ticketDateConfig:
                  editProductType === "ticket"
                    ? {
                        ...editTicketDateConfig,
                        excludedDates: editTicketDateConfig.excludedDates
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean)
                          .join("\n"),
                      }
                    : emptyTicketDateConfig(),
                validDayOptions:
                  editProductType === "ticket" ? editTicketDateResult.options : [],
                image: editProductImage || undefined,
                autoDeliver: editAutoDeliver,
              }
            : item,
        ),
      );

      // Update original values after successful save
      setOriginalProducts(prev =>
        prev.map(orig =>
          orig.id === editingProductId
            ? {
                ...orig,
                name: editProductName.trim(),
                quantityLeft: parsedQuantity,
                isActive: editIsActive,
                productType: editProductType,
                ticketDateConfig:
                  editProductType === "ticket"
                    ? {
                        ...editTicketDateConfig,
                        excludedDates: editTicketDateConfig.excludedDates
                          .split("\n")
                          .map((value) => value.trim())
                          .filter(Boolean)
                          .join("\n"),
                      }
                    : emptyTicketDateConfig(),
                validDayOptions:
                  editProductType === "ticket" ? editTicketDateResult.options : [],
                image: editProductImage || undefined,
                autoDeliver: editAutoDeliver,
              }
            : orig
        )
      );

      toast.success(`"${editProductName.trim()}" updated successfully!`);
      setEditDialogOpen(false);
      resetEditForm();
    } catch (error: unknown) {
      console.error('Error saving product:', error);
      const errorMessage = getErrorMessage(error, "Failed to save changes. Please try again.");
      toast.error(errorMessage);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleEnableShop = async () => {
    if (!club?.club_account_id) return;

    try {
      setIsEnablingShop(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        enable_shop: true,
      });

      if (response?.message) {
        toast.success("Shop enabled successfully");
        syncShopSettingsState({ enable_shop: true });
      } else {
        toast.error("Failed to enable shop");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error enabling shop"));
      console.error("Error enabling shop:", err);
    } finally {
      setIsEnablingShop(false);
    }
  };

  const handleToggleShop = async (enabled: boolean) => {
    if (!club?.club_account_id) return;

    try {
      setIsTogglingShop(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        enable_shop: enabled,
      });
      
      if (response?.message) {
        toast.success(
          enabled ? "Shop enabled successfully" : "Shop disabled successfully"
        );
        syncShopSettingsState({ enable_shop: enabled });
      } else {
        toast.error("Failed to update shop settings");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error updating shop settings"));
      console.error("Error toggling shop:", err);
    } finally {
      setIsTogglingShop(false);
    }
  };

  const handleTogglePublicShop = async (isPublic: boolean) => {
    if (!club?.club_account_id) return;

    try {
      setIsTogglingPublicShop(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        public_shop: isPublic,
      });

      if (response?.message) {
        toast.success(
          isPublic ? "Shop is now visible on the public club page" : "Shop is now restricted to registered club members"
        );
        syncShopSettingsState({ public_shop: isPublic });
      } else {
        toast.error("Failed to update shop visibility");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error updating shop visibility"));
      console.error("Error toggling public shop:", err);
    } finally {
      setIsTogglingPublicShop(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your club's merchandise and product catalog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {club?.enable_shop && (
              <Button
                onClick={() => setShowShopSettings(true)}
                variant="outline"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
                title="Shop settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {!club?.enable_shop && (
          <Card className="mb-6 overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-0">
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
                  <p className="pt-1 text-xs leading-snug text-amber-700/90">
                    Enabling the shop and selling items results in a Clubby charge of 2% of each product sold.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleEnableShop}
                disabled={isEnablingShop}
                className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
              >
                {isEnablingShop ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  "Enable Shop"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="w-full min-w-0 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table
              style={{
                width: "100%",
                minWidth: "860px",
                borderCollapse: "separate",
                borderSpacing: "0 6px",
              }}
            >
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="h-14 w-[110px] text-sm font-semibold text-slate-600">
                    Image
                  </TableHead>
                  <TableHead className="h-14 text-sm font-semibold text-slate-600">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => handleSort("name")}
                    >
                      Product Name
                      {nameSortAsc === null ? (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      ) : (
                        <span className="text-xs">{nameSortAsc ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="h-14 w-[130px] text-sm font-semibold text-slate-600">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => handleSort("price")}
                    >
                      Price
                      {priceSortAsc === null ? (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      ) : (
                        <span className="text-xs">{priceSortAsc ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="h-14 w-[120px] text-sm font-semibold text-slate-600">
                    Status
                  </TableHead>
                  <TableHead className="h-14 w-[160px] text-sm font-semibold text-slate-600">
                    Purchase Limit
                  </TableHead>
                  <TableHead className="h-14 w-[140px] text-sm font-semibold text-slate-600">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created
                      {createdAtSortAsc === null ? (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      ) : (
                        <span className="text-xs">{createdAtSortAsc ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="h-14 w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody className="bg-slate-50/70">
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : productsError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-red-500">
                      Error loading products. Please try again.
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length ? (
                  sortedProducts.map((product) => (
                    <TableRow key={product.id} className="h-14 border-0">
                      <TableCell className="w-[110px]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-11 w-11 cursor-pointer rounded-lg border border-slate-200 object-cover transition-opacity hover:opacity-80"
                            onClick={() => product.image && handleImageClick(product.image)}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-slate-900">{product.name}</span>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {product.productType === "ticket" ? "Ticket or pass" : "Standard product"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="w-[130px]">
                        {product.price === 0 ? (
                          <Badge variant="secondary" className="cursor-default bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            Free
                          </Badge>
                        ) : (
                          <span className="font-medium text-slate-900">
                            {formatAmount(product.price * 100, club?.currency)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className="cursor-default opacity-80"
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[160px]">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">{product.allowMultiple ? "Multiple" : "Single"}</Badge>
                          {product.productType === "ticket" && (
                            <span className="text-xs text-slate-400">
                              {formatTicketDateSummary(product.validDayOptions)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px] text-sm text-slate-600">
                        {formatDate(product.createdAt)}
                      </TableCell>
                      <TableCell className="w-[70px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="text"
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder={formatAmount(0, club?.currency)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {productImage ? (
                  <div className="space-y-3">
                    <img
                      src={productImage}
                      alt="Product preview"
                      className="h-32 w-32 object-cover rounded-lg mx-auto border border-gray-200 shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Image selected</p>
                      <label htmlFor="productImage" className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        Click to change
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <label htmlFor="productImage" className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                        Click to upload image
                      </label>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="isActive">Active Product (visible to members)</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type</Label>
              <Select value={productType} onValueChange={(value) => setProductType(value as "standard" | "ticket")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard product</SelectItem>
                  <SelectItem value="ticket">Ticket or pass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {productType === "ticket" ? (
              <div className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ticketStartDate">Start Date</Label>
                    <Input
                      id="ticketStartDate"
                      type="date"
                      value={ticketDateConfig.startDate}
                      onChange={(e) =>
                        setTicketDateConfig((current) => ({
                          ...current,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketEndDate">End Date</Label>
                    <Input
                      id="ticketEndDate"
                      type="date"
                      value={ticketDateConfig.endDate}
                      onChange={(e) =>
                        setTicketDateConfig((current) => ({
                          ...current,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketExcludedDates">Excluded Dates</Label>
                  <Textarea
                    id="ticketExcludedDates"
                    value={ticketDateConfig.excludedDates}
                    onChange={(e) =>
                      setTicketDateConfig((current) => ({
                        ...current,
                        excludedDates: e.target.value,
                      }))
                    }
                    placeholder={"2026-07-12\n2026-07-15"}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Buyers will choose one date within the range. Enter any excluded dates on separate lines using YYYY-MM-DD.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="allowMultiple">Purchase Limit</Label>
              <Select value={allowMultiple ? "multiple" : "single"} onValueChange={(value) => setAllowMultiple(value === "multiple")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Members can select only 1</SelectItem>
                  <SelectItem value="multiple">Members can select multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoDeliver" className="text-sm font-medium">Auto-deliver when paid</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically mark this item as delivered once payment is received</p>
              </div>
              <Switch
                id="autoDeliver"
                checked={autoDeliver}
                onCheckedChange={setAutoDeliver}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSubmit}
              disabled={!productName}
            >
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            resetEditForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editProductName">Product Name *</Label>
              <Input
                id="editProductName"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editQuantityLeft">Quantity Available</Label>
              <Input
                id="editQuantityLeft"
                type="number"
                min="0"
                value={editQuantityLeft}
                onChange={(e) => setEditQuantityLeft(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="editProductType">Product Type</Label>
              <Select value={editProductType} onValueChange={(value) => setEditProductType(value as "standard" | "ticket") }>
                <SelectTrigger id="editProductType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard product</SelectItem>
                  <SelectItem value="ticket">Ticket or pass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editProductType === "ticket" ? (
              <div className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editTicketStartDate">Start Date</Label>
                    <Input
                      id="editTicketStartDate"
                      type="date"
                      value={editTicketDateConfig.startDate}
                      onChange={(e) =>
                        setEditTicketDateConfig((current) => ({
                          ...current,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editTicketEndDate">End Date</Label>
                    <Input
                      id="editTicketEndDate"
                      type="date"
                      value={editTicketDateConfig.endDate}
                      onChange={(e) =>
                        setEditTicketDateConfig((current) => ({
                          ...current,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTicketExcludedDates">Excluded Dates</Label>
                  <Textarea
                    id="editTicketExcludedDates"
                    value={editTicketDateConfig.excludedDates}
                    onChange={(e) =>
                      setEditTicketDateConfig((current) => ({
                        ...current,
                        excludedDates: e.target.value,
                      }))
                    }
                    placeholder={"2026-07-12\n2026-07-15"}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Existing ticket dates are expanded into a range automatically. Enter excluded dates on separate lines using YYYY-MM-DD.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <Label>Product Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {editProductImage ? (
                  <div className="space-y-3">
                    <img
                      src={editProductImage}
                      alt="Product preview"
                      className="mx-auto h-32 w-32 rounded-lg border border-gray-200 object-cover shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Image selected</p>
                      <label htmlFor="editProductImage" className="cursor-pointer text-xs text-blue-600 underline hover:text-blue-700">
                        Click to change
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <label htmlFor="editProductImage" className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        Click to upload image
                      </label>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
                <Input
                  id="editProductImage"
                  type="file"
                  accept="image/*"
                  onChange={handleEditProductImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsActive"
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked as boolean)}
              />
              <Label htmlFor="editIsActive">Active Product (visible to members)</Label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="editAutoDeliver" className="text-sm font-medium">Auto-deliver when paid</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically mark this item as delivered once payment is received</p>
              </div>
              <Switch
                id="editAutoDeliver"
                checked={editAutoDeliver}
                onCheckedChange={setEditAutoDeliver}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!editProductName.trim() || isSavingProduct}
            >
              {isSavingProduct ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl flex items-center justify-center">
          {selectedImageUrl && (
            <img 
              src={selectedImageUrl} 
              alt="Product"
              className="max-h-[80vh] max-w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showShopSettings} onOpenChange={setShowShopSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shop Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Enable Shop</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Toggle to enable or disable your shop for members
                </p>
              </div>
              <Switch
                checked={club?.enable_shop || false}
                onCheckedChange={handleToggleShop}
                disabled={isTogglingShop}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">Make shop public</Label>
                <p className="mt-1 text-sm text-gray-600">
                  Let visitors on the club public page browse the shop without logging in or being registered with this club.
                </p>
              </div>
              <Switch
                checked={club?.public_shop === true}
                onCheckedChange={handleTogglePublicShop}
                disabled={isTogglingPublicShop || !club?.enable_shop}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowShopSettings(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}