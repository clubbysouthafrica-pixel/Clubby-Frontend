import React, { useState, useContext, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Eye, ChevronsUpDown, ImageIcon, Upload, AlertCircle, Loader2, Settings } from "lucide-react";
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

export default function ProductsPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const queryClient = useQueryClient();
  const { data: productsData, isLoading: productsLoading, error: productsError } = useFetchClubProducts(club?.club_account_id || "");
  
  const [products, setProducts] = useState<any[]>([]);
  const [originalProducts, setOriginalProducts] = useState<any[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<any>>(new Set());
  const [editingProducts, setEditingProducts] = useState<Set<any>>(new Set());
  const [nameSortAsc, setNameSortAsc] = useState<boolean | null>(null);
  const [priceSortAsc, setPriceSortAsc] = useState<boolean | null>(null);
  const [quantitySortAsc, setQuantitySortAsc] = useState<boolean | null>(null);
  const [createdAtSortAsc, setCreatedAtSortAsc] = useState<boolean | null>(null);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  
  // Form state
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [productImage, setProductImage] = useState<string>("");
  const [isEnablingShop, setIsEnablingShop] = useState(false);
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [showShopSettings, setShowShopSettings] = useState(false);

  // Sync API data with local state
  useEffect(() => {
    if (productsData?.products) {
      const formattedProducts = productsData.products.map((product: any) => ({
        id: product.product_id,
        name: product.name,
        price: product.price / 100, // Convert from cents to dollars for display
        quantityLeft: product.initial_quantity,
        isActive: product.active_product,
        createdAt: product.created_date,
        description: product.description,
        allowMultiple: product.purchase_limit === "multiple",
        image: product?.product_image_url ?? undefined,
      }));
      setProducts(formattedProducts);
      setOriginalProducts(JSON.parse(JSON.stringify(formattedProducts)));
      setUnsavedChanges(new Set());
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
    setProductImage("");
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
    if (!productName || !price || !club?.club_account_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const productRequest: AddProductRequest = {
        club_account_id: club.club_account_id,
        name: productName,
        price: parseFloat(price) * 100, // Convert to cents as expected by backend
        active_product: isActive,
        purchase_limit: allowMultiple ? "multiple" : "single",
        description: description || undefined,
        ...(productImage && { product_image: productImage }),
      };

      const response = await addProduct(productRequest);
      
      // Add the new product to the local state for immediate UI update
      const newProduct = {
        id: response.product_id || products.length + 1,
        name: productName,
        price: parseFloat(price),
        quantityLeft: 0,
        isActive,
        createdAt: Math.floor(Date.now() / 1000), // Current epoch time
        description,
        allowMultiple,
      };

      setProducts(prev => [...prev, newProduct]);
      toast.success(`Product "${productName}" added successfully!`);
      
      // Invalidate and refetch products query
      queryClient.invalidateQueries({ queryKey: ['clubProducts', club.club_account_id] });
      
      resetForm();
      setOpenDialog(false);
    } catch (error: any) {
      console.error('Error adding product:', error);
      const errorMessage = error?.response?.data?.message || "Failed to add product. Please try again.";
      toast.error(errorMessage);
    }
  };

  const sortedProducts = React.useMemo(() => {
    let sortedCopy = [...products];

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

  const handleToggleActive = (productId: any) => {
    if (!editingProducts.has(productId)) return; // Only allow changes in edit mode
    
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, isActive: !product.isActive }
          : product
      )
    );
    setUnsavedChanges(prev => new Set([...prev, productId]));
  };

  const handleNameChange = (productId: any, newName: string) => {
    if (!editingProducts.has(productId)) return; // Only allow changes in edit mode
    
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, name: newName }
          : product
      )
    );
    setUnsavedChanges(prev => new Set([...prev, productId]));
  };

  const handleEditProduct = (productId: any) => {
    setEditingProducts(prev => new Set([...prev, productId]));
  };

  const handleDiscardProduct = (productId: any) => {
    const originalProduct = originalProducts.find(p => p.id === productId);
    if (!originalProduct) return;

    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              name: originalProduct.name,
              quantityLeft: originalProduct.quantityLeft, 
              isActive: originalProduct.isActive,
              image: originalProduct.image
            }
          : product
      )
    );
    
    setUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    
    setEditingProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const handleProductImageUpdate = (productId: any, imageUrl: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? { ...product, image: imageUrl }
          : product
      )
    );
    
    setUnsavedChanges(prev => new Set([...prev, productId]));
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageDialogOpen(true);
  };

  const handleSaveProduct = async (productId: any) => {
    const product = products.find(p => p.id === productId);
    const originalProduct = originalProducts.find(p => p.id === productId);
    if (!product || !club?.club_account_id) return;

    try {
      const updateRequest: UpdateProductRequest = {
        product_id: productId.toString(),
        club_account_id: club.club_account_id,
        name: product.name,
        initial_quantity: product.quantityLeft,
        active_product: product.isActive,
      };

      // Only include product_image if it has changed
      if (originalProduct && product.image !== originalProduct.image) {
        updateRequest.product_image = product.image;
      }

      await updateProduct(updateRequest);
      
      // Update original values after successful save
      setOriginalProducts(prev => 
        prev.map(orig => 
          orig.id === productId 
            ? { ...orig, name: product.name, quantityLeft: product.quantityLeft, isActive: product.isActive, image: product.image }
            : orig
        )
      );
      
      setUnsavedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      setEditingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      toast.success(`"${product.name}" updated successfully!`);
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error?.response?.data?.message || "Failed to save changes. Please try again.";
      toast.error(errorMessage);
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
        setClub({ ...club, enable_shop: true });
      } else {
        toast.error("Failed to enable shop");
      }
    } catch (err: any) {
      toast.error(err.message || "Error enabling shop");
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
        setClub({ ...club, enable_shop: enabled });
      } else {
        toast.error("Failed to update shop settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating shop settings");
      console.error("Error toggling shop:", err);
    } finally {
      setIsTogglingShop(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your club's merchandise and product catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {club?.enable_shop && (
            <Button
              onClick={() => setShowShopSettings(true)}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
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
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">
                  Shop is currently disabled
                </p>
                <p className="text-sm text-orange-700">
                  Enable your shop to make it visible to members and start receiving orders
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnableShop}
              disabled={isEnablingShop}
              className="bg-orange-600 hover:bg-orange-700 text-white"
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

      {/* Products Table */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Current stock levels and product status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border w-full overflow-hidden">
              <div className="overflow-y-auto overflow-x-auto">
                <Table className="table-auto" style={{ minWidth: "1190px" }}>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-center w-[140px]">
                        Image
                      </TableHead>
                      <TableHead className="text-center w-[140px]">
                        <button
                          className="flex items-center justify-center gap-1 w-full hover:bg-gray-100 rounded p-1"
                          onClick={() => handleSort('name')}
                        >
                          Product Name
                          {nameSortAsc === null ? (
                            <ChevronsUpDown className="h-3 w-3 opacity-60" />
                          ) : (
                            <span className="text-xs">
                              {nameSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center w-[120px]">
                        <button
                          className="flex items-center justify-center gap-1 w-full hover:bg-gray-100 rounded p-1"
                          onClick={() => handleSort('price')}
                        >
                          Price
                          {priceSortAsc === null ? (
                            <ChevronsUpDown className="h-3 w-3 opacity-60" />
                          ) : (
                            <span className="text-xs">
                              {priceSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center w-[160px]">
                        Active Product
                      </TableHead>
                      <TableHead className="text-center w-[140px]">
                        Purchase Limit
                      </TableHead>
                      <TableHead className="text-center w-[140px]">
                        <button
                          className="flex items-center justify-center gap-1 w-full hover:bg-gray-100 rounded p-1"
                          onClick={() => handleSort('createdAt')}
                        >
                          Created At
                          {createdAtSortAsc === null ? (
                            <ChevronsUpDown className="h-3 w-3 opacity-60" />
                          ) : (
                            <span className="text-xs">
                              {createdAtSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading products...
                        </TableCell>
                      </TableRow>
                    ) : productsError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-600">
                          Error loading products. Please try again.
                        </TableCell>
                      </TableRow>
                    ) : sortedProducts.length ? (
                      sortedProducts.map((product) => (
                        <TableRow 
                          key={product.id} 
                          className={`h-12 ${
                            editingProducts.has(product.id)
                              ? 'bg-blue-50 border-l-4 border-l-blue-400'
                              : unsavedChanges.has(product.id) 
                              ? 'bg-yellow-50 border-l-4 border-l-yellow-400' 
                              : ''
                          }`}
                        >
                          <TableCell className="text-center w-[140px]">
                            {editingProducts.has(product.id) ? (
                              <div className="flex justify-center">
                                <div className="relative group">
                                  <input
                                    id={`product-image-${product.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          const imageUrl = event.target?.result as string;
                                          handleProductImageUpdate(product.id, imageUrl);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`product-image-${product.id}`}
                                    className="block cursor-pointer"
                                  >
                                    {product.image ? (
                                      <img 
                                        src={product.image} 
                                        alt={product.name}
                                        className="h-12 w-12 object-cover rounded border group-hover:opacity-75 transition-opacity"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : (
                                      <div className="h-12 w-12 bg-gray-100 rounded border group-hover:opacity-75 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                      <Upload className="h-4 w-4 text-white" />
                                    </div>
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <>
                                {product.image ? (
                                  <div className="flex justify-center">
                                    <img 
                                      src={product.image} 
                                      alt={product.name}
                                      className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                      onClick={() => handleImageClick(product.image)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <div className="hidden flex items-center justify-center h-12 w-12 bg-gray-100 rounded border">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="flex items-center justify-center h-12 w-12 bg-gray-100 rounded border">
                                      <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="text-center w-[140px]">
                            {editingProducts.has(product.id) ? (
                              <Input
                                type="text"
                                value={product.name}
                                onChange={(e) => handleNameChange(product.id, e.target.value)}
                                className="h-6 text-center text-xs font-medium"
                              />
                            ) : (
                              <span className="font-medium">{product.name}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center w-[120px]">
                            {formatAmount(product.price * 100, club?.currency)}
                          </TableCell>
                          <TableCell className="text-center w-[160px]">
                            <Badge 
                              variant={product.isActive ? "default" : "secondary"}
                              className={`${
                                editingProducts.has(product.id) 
                                  ? 'cursor-pointer hover:opacity-80 transition-opacity'
                                  : 'cursor-default opacity-70'
                              }`}
                              onClick={() => editingProducts.has(product.id) && handleToggleActive(product.id)}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center w-[140px]">
                            <Badge variant="outline">
                              {product.allowMultiple ? "Multiple" : "Single"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center w-[140px]">
                            {formatDate(product.createdAt)}
                          </TableCell>
                          <TableCell className="text-center w-[100px]">
                            {editingProducts.has(product.id) ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveProduct(product.id)}
                                  className="h-6 px-2 text-xs text-green-600 hover:bg-green-50"
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDiscardProduct(product.id)}
                                  className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Discard
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product.id)}
                                className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No products found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory
            </CardTitle>
            <CardDescription>Manage stock levels and product variants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track inventory, set stock alerts, and manage product variations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Product Catalog
            </CardTitle>
            <CardDescription>View and organize your products</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse your complete product catalog and manage categories.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set prices and manage discounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure product pricing, member discounts, and promotional offers.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
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
              <Label htmlFor="price">Price *</Label>
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
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSubmit}
              disabled={!productName || !price}
            >
              Add Product
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