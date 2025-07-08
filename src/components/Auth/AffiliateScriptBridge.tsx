"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function AffiliateScriptBridge() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    setInit(true); // only true after component mounts on the client
  }, []);

  return (
    <>
      {init && (
        <Script
          src="https://affiliate-marketing-ten.vercel.app/affiliateTrackingJavascript.js"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
