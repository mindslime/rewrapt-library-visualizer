import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const figtree = Figtree({ subsets: ["latin"], display: "block" });

export const metadata: Metadata = {
  title: "Spotify ReWrapt",
  description: "Visualize your music taste",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.className} antialiased bg-black text-white`}>
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
