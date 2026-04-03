import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const mono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/JetBrainsMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/JetBrainsMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "Trading Journal | kiani.vc",
  description: "Log trades, track P&L, upload charts, and get AI coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Blocking script to set theme before first paint — prevents dark flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("journal-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark");else{document.documentElement.setAttribute("data-theme","light");if(t!=="light")localStorage.setItem("journal-theme","light")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${mono.variable} font-mono antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
