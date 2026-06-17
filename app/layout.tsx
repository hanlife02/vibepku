import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/app/components/nav";
import { ThemeScript } from "@/app/components/theme-script";

export const metadata: Metadata = {
  title: "VibePKU",
  description: "收集用 AI coding 工具做出来的真实产品。",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme")||"system";var d;if(t==="system"){d=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}else{d=t}document.documentElement.setAttribute("data-theme",d)}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeScript />
        <Nav />
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
