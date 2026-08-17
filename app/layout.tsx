import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify",
  description: "Music streaming service",
  // Names the installed window on desktop, and is what Windows shows in the
  // task bar. `manifest` itself needs no entry here — `app/manifest.ts` emits
  // the link tag on every document.
  applicationName: "Spotify",
  appleWebApp: {
    // iOS has no manifest support worth relying on: standalone display, the
    // status-bar treatment and the home-screen icon are all driven by these
    // meta tags instead.
    capable: true,
    title: "Spotify",
    // Lets the app paint under the status bar, which `theme_color` alone does
    // not achieve on iOS.
    statusBarStyle: "black-translucent",
  },
  icons: {
    // Safari composites a transparent icon onto white, so iOS gets the variant
    // with the brand background baked in.
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Two values, because the OS chrome should follow the theme rather than being
  // pinned to whichever one the app happens to open on. The colours are the
  // `--background` tokens from globals.css, resolved to hex.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#060607" },
  ],
  // An installed app is a window, not a document: pinch-zooming the player
  // chrome is not a gesture anyone wants, but `user-scalable=no` would take
  // zoom away from people who need it, so only the default scale is fixed.
  width: "device-width",
  initialScale: 1,
  // Paint into the display cutout area on phones that have one.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
