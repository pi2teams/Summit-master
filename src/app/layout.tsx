import { Providers } from "./providers";
import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
        >
          {/* Pi Browser SDK. Safe to include for non-Pi browsers. */}
          <Script
            src="https://sdk.minepi.com/pi-sdk.js"
            strategy="beforeInteractive"
          />
          {/* Vercel platform instrumentation (Web Analytics & Speed Insights). */}
          <Script
            src="/_vercel/insights/script.js"
            strategy="afterInteractive"
            defer
          />
          <Script
            src="/_vercel/speed-insights/script.js"
            strategy="afterInteractive"
            defer
          />
          <Providers>
            {children}
          </Providers>
      </body>
    </html>
  );
}
