import type { Metadata } from "next";
import { Inter, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// The UI font. A variable font, so one file serves every weight.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Waypoint",
  description: "External memory for the status and progress of your work.",
};

/*
 * Runs before first paint, so the stored theme, palette, font and sidebar state show at once.
 * Keep the defaults and the legacy "forest" mapping in step with src/lib/color-theme.ts.
 * "forest" was the default palette before the lime redesign. It maps to "lime".
 */
const themeInit = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("wp-theme");var r=t==="light"||t==="dark"?t:(t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"dark");d.setAttribute("data-theme",r);var c=localStorage.getItem("wp-color-theme");if(c!=="paper"&&c!=="nord"&&c!=="royal")c="lime";d.setAttribute("data-color-theme",c);var f=localStorage.getItem("wp-font-theme");if(f!=="serif"&&f!=="mono")f="sans";d.setAttribute("data-font-theme",f);if(localStorage.getItem("wp-sidebar")==="collapsed")d.setAttribute("data-sidebar","collapsed");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
