import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/i18n";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EV.JO — Always Connected, Always Charged",
  description:
    "مساعد السيارات الكهربائية في الأردن — محطات شحن سريع، مخطط رحلات، وحاسبة تكلفة الشحن حسب فترات التعرفة.",
};

export const viewport: Viewport = {
  themeColor: "#1B7A4B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (cookies().get("locale")?.value === "en" ? "en" : "ar") as Locale;
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={plex.className}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
