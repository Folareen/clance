import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/components/store-provider";
import { ToastContainer } from "@/components/toast";
import { THEME_KEY } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clance",
  description:
    "One project-shaped home for contract, freelance, and lean teams.",
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
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
