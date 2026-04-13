import PaymentsTabContent from "@/components/member/payments/payments-tab-content";

type ClubPaymentsTabProps = React.ComponentProps<typeof PaymentsTabContent>;

export function ClubPaymentsTab(props: ClubPaymentsTabProps) {
  return <PaymentsTabContent {...props} />;
}