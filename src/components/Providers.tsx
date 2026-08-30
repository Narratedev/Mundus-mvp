"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#6366f1",
          logo: "/logo.png",
        },
        loginMethods: ["email", "google", "twitter", "discord"],
        embeddedWallets: {
          createOnLogin: "off", // no wallets yet as per requirements
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
