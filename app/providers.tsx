'use client';

import { ClerkProvider } from "@clerk/clerk-react";


export function Providers({ children }: { children: React.ReactNode }) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  return (
        {/* ClerkProvider with NextUIProvider */
      <ClerkProvider
        publishableKey={clerkPubKey}
        appearance={{
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#ffffff",
            colorInputBackground: "#f8fafc",
            colorTextOnPrimaryBackground: "#ffffff",
            colorText: "#1e293b",
          },
        }}
      >
        {children}
      </ClerkProvider>
    // </NextThemesProvider>
  );
}