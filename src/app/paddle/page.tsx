// app/paddle/page.tsx
import React from "react";
import Payment from "@/components/pages/Paddle";
import { getSubscriptionByEmail } from "@/lib/paddle";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const PaddlePage = async () => {
  const email = "zak@gmail.com";
  const subData = await getSubscriptionByEmail(email);

  return (
    <>
      {/* 3. Pass the ID down as a prop to the Client Component */}
      <Payment
        email={email}
        initialSubscriptionId={subData?.id ?? null}
        currentPriceId={subData?.priceId ?? null}
      />
    </>
  );
};

export default PaddlePage;
