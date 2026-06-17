import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TapLink",
  description:
    "A scannable digital business card with built-in lead capture and scan tracking.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TapLink",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Let content extend under the iOS status bar / home indicator so the
  // installed app feels full-screen; components already use safe-area insets.
  viewportFit: "cover",
  themeColor: "#0c5c54",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
