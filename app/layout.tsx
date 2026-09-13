import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Refrigeration Equivalent Length Calculator",
  description:
    "Build an actual refrigeration piping run — straight sections, rises, drops, fittings and valves — and get a traceable total equivalent length with every value showing its formula and source.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
