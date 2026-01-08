import CheckoutPage from "@/components/pages/CheckoutPage";
import { getUserSubscription } from "@/app/checkout/actions";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page() {
  const userEmail = "zak@gmail.com";
  const subscription = await getUserSubscription(userEmail);

  return (
    <CheckoutPage
      userEmail={userEmail}
      isSubscribed={subscription.subscribed}
      currentPriceId={subscription.currentPriceId}
    />
  );
}
