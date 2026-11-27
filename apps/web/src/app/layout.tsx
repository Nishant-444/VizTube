import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser, hasRefreshToken } from "@/lib/api/server";
import "./globals.css";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "VizTube", template: "%s · VizTube" },
  description: "Watch, share and ask questions about videos with AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, canRefresh] = await Promise.all([getCurrentUser(), hasRefreshToken()]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <Providers initialUser={user} canRefresh={canRefresh}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
