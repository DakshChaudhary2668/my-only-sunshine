import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A little note for Nidhi",
  description: "A quiet, honest note—written properly.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fff9ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
