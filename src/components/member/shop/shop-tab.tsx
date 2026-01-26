import { TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopTabProps {
  clubId: string;
  isMobile: boolean;
  isClubMember: boolean;
  isRegistered: boolean;
}

export function ShopTab({ isMobile, isClubMember, isRegistered }: ShopTabProps) {
  // Hide shop tab in production environment
  const isProd = import.meta.env.VITE_ENVIRONMENT === "Prod";
  
  if (!isClubMember || !isRegistered || isProd) {
    return null;
  }

  return (
    <TabsTrigger
      className={cn(
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 font-medium",
        isMobile
          ? "w-full justify-center text-sm h-10"
          : "w-[200px] h-10"
      )}
      value="shop"
    >
      <ShoppingBag className="w-4 h-4 mr-2" />
      Shop
    </TabsTrigger>
  );
}