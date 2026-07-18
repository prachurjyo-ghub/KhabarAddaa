import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart-provider";
import { AuthProvider } from "@/components/auth-provider";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata, restaurantJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: "/",
  }),
  keywords: [
    "KhabarAdda",
    "restaurant Dhanmondi",
    "restaurant Dhaka",
    "Dhanmondi dining",
    "food delivery Dhaka",
    "table reservation Dhaka",
    "order food online Bangladesh",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <JsonLd data={restaurantJsonLd()} />
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster richColors position="top-center" theme="dark" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
