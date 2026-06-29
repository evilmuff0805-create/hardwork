import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supabase Auth App",
  description: "Next.js app with Supabase authentication and protected routes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
