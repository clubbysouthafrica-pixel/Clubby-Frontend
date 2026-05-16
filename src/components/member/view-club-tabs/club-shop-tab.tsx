import { TabsContent } from "@/components/ui/tabs";
import MemberShopPage from "@/components/member/shop/shop";

type ClubShopTabProps = {
  enabled: boolean;
};

export function ClubShopTab({ enabled }: ClubShopTabProps) {
  if (!enabled) {
    return null;
  }

  return (
    <TabsContent value="shop">
      <MemberShopPage embedded />
    </TabsContent>
  );
}