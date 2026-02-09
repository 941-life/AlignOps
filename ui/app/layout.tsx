"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="hsl(210 40% 98%)" />
        <title>AlignOps Control Plane</title>
        <meta name="description" content="Dataset validation and quality control platform" />
      </head>
      <body className={inter.className}>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link 
                href="/" 
                className="text-xl font-semibold text-slate-900 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
              >
                AlignOps
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={cn(
                    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-3 py-2",
                    pathname === "/"
                      ? "text-slate-900 font-medium bg-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  Datasets
                </Link>
                <Link
                  href="/control-plane"
                  className={cn(
                    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-3 py-2",
                    pathname === "/control-plane"
                      ? "text-slate-900 font-medium bg-slate-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  Control Plane
                </Link>
                <Button asChild size="sm">
                  <Link href="/datasets/new">
                    Create Dataset
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </header>
        <main className="flex-1 bg-slate-50">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-slate-500">
            AlignOps &copy; {new Date().getFullYear()} &mdash; Dataset Validation Platform
          </div>
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}

