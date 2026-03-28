import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Sandyq - RWA Tokenization Platform",
  description:
    "Compliance-gated real world asset tokenization on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <AppProviders>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-60">
              <Header />
              <main className="p-6">{children}</main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
