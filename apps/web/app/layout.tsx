import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";
import { ToastContainer } from "@/components/toast";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { THEME_KEY } from "@/lib/constants";
import "./globals.css";

// Display face: used for marketing headlines and page titles only. Bricolage
// has enough personality to carry a hero and enough width variation to stay
// readable when a headline wraps; it is deliberately kept off dense UI text.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-next",
  display: "swap",
  axes: ["opsz"],
});

// Everything else. Geist is neutral at the small sizes a task list lives at.
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans-next",
  display: "swap",
});

// Task IDs (#14.2), inline keys, code blocks.
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-next",
  display: "swap",
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full antialiased ${display.variable} ${sans.variable} ${mono.variable}`}
    >
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
