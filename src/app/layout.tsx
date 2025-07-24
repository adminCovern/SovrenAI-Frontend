import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CommandCenterProvider from "../providers/CommandCenterProvider";
import { RevolutionaryEngineeringProvider } from "../providers/RevolutionaryEngineeringProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOVREN Executive Command Center",
  description: "Holographic command bridge for AI executives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <CommandCenterProvider>
          <RevolutionaryEngineeringProvider>
            {children}
          </RevolutionaryEngineeringProvider>
        </CommandCenterProvider>
      </body>
    </html>
  );
}
