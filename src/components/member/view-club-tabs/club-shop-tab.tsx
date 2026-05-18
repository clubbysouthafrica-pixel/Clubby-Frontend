import { TabsContent } from "@/components/ui/tabs";
import MemberShopPage from "@/components/member/shop/shop";
import { useIsMobile } from "@/hooks/use-mobile";

type ClubShopTabProps = {
  enabled: boolean;
};

export function ClubShopTab({ enabled }: ClubShopTabProps) {
  const isMobile = useIsMobile();

  if (!enabled) {
    return null;
  }

  return (
    <TabsContent value="shop" className={isMobile ? undefined : "mt-6"}>
      <MemberShopPage embedded />
    </TabsContent>
  );
}