import type { Metadata } from "next";
import { Bitter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-bitter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UTEC Carpool",
  description: "Viaja con alguien de tu universidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bitter.variable} ${plusJakartaSans.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
