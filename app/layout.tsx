import type { Metadata } from "next";
import { Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/*
 * Public Sans and IBM Plex Mono are the faces Sanjeev used in his prototypes.
 * Loaded through next/font so they are self-hosted and preloaded — the
 * prototypes pulled them from Google's CDN at runtime, which costs a render
 * round-trip and leaks a request per visitor.
 */
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HVACRiQNet — HVACR Virtual Engineering Tools",
    template: "%s · HVACRiQNet",
  },
  description:
    "HVACR virtual engineering tools, intelligence and professional networking. Transparent, standards-referenced calculations for refrigeration and HVAC design.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Applies the saved theme before first paint. Without this the page
          renders in the system theme and then snaps to the chosen one.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
