import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FlowProvider } from "@/components/flow/FlowProvider";
import { PasswordGate } from "@/components/chrome/PasswordGate";
import { SHOW_WTW } from "@/lib/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: SHOW_WTW ? "Bobcat | WTW Retirement" : "Bobcat",
  description: "Bobcat retirement planning prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <PasswordGate>
          <FlowProvider>{children}</FlowProvider>
        </PasswordGate>
      </body>
    </html>
  );
}
