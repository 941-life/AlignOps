import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlignOps Control Plane",
  description: "Dataset validation and quality control platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="hsl(210 40% 98%)" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-slate-200 bg-white">
              <div className="container mx-auto px-4 py-4">
                <nav className="flex items-center justify-between">
                  <Link 
                    href="/" 
                    className="text-xl font-semibold text-slate-900 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-2 py-1"
                  >
                    AlignOps
                  </Link>
                  <div className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-3 py-2"
                    >
                      Datasets
                    </Link>
                    <Link
                      href="/control-plane"
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-3 py-2"
                    >
                      Control Plane
                    </Link>
                  </div>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-slate-500">
                AlignOps &copy; {new Date().getFullYear()} &mdash; Dataset Validation Platform
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

