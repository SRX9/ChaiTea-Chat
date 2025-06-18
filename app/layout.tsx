import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ScrollProvider } from "@/lib/ScrollContext";
import { RootLayoutContent } from "./RootLayoutContent";
import { siteConfig } from "@/config/site";
import { geistSans, geistMono } from "@/config/font";
import { fontHeading } from "@/config/ts-style";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.about.keywords,
  authors: [
    {
      name: "ChaiTea",
      url: siteConfig.url,
    },
  ],
  creator: "ChaiTea",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="ChaiTea" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} ${fontHeading.variable} antialiased`}
      >
        <Providers>
          <ScrollProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </ScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
