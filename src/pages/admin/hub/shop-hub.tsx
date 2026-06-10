import { SectionHub } from "@/components/admin/section-hub"
import { Package, ShoppingCart } from "lucide-react"

export default function ShopHubPage() {
  return (
    <SectionHub
      title="Shop"
      description="Manage your club's online shop, create products, and fulfil customer orders."
      items={[
        {
          title: "Products",
          description: "Create and manage items available for purchase in your shop.",
          url: "/shop/products",
          icon: Package,
        },
        {
          title: "Orders",
          description: "View, manage, and fulfil customer orders.",
          url: "/shop/orders",
          icon: ShoppingCart,
        },
      ]}
    />
  )
}
