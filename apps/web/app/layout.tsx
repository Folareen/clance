import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";
import { ToastContainer } from "@/components/toast";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { THEME_KEY } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clance",
  description:
    "One project-shaped home for contract, freelance, and lean teams.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
        <StoreProvider>
          <ThemeProvider>
            {children}
            <ToastContainer />
            <ServiceWorkerRegistrar />
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
