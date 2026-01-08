import CheckoutPage from "@/components/pages/CheckoutPage";
import { getUserSubscription } from "@/app/checkout/actions";

export default async function Page() {
  // In the future, get this from your Auth session
  const userEmail = "zak@gmail.com";

  // Query Stripe for this user's current status
  const subscription = await getUserSubscription(userEmail);

  return (
    <CheckoutPage
      userEmail={userEmail}
      isSubscribed={subscription.subscribed}
      currentPriceId={subscription.currentPriceId}
    />
  );
}
