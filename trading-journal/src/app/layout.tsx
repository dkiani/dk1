import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("journal-theme");if(t==="light")document.documentElement.setAttribute("data-theme","light");else{document.documentElement.setAttribute("data-theme","dark");if(t!=="dark")localStorage.setItem("journal-theme","dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-mono antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
