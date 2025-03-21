import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import TrackContextProvider from "@/providers/TrackProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unacademy Clone",
  description: "Live streaming education platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TrackContextProvider>
            {" "}
            {/* Use the Client Component */}
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 container mx-auto p-4">{children}</main>
              </div>
              <Toaster />
            </AuthProvider>
          </TrackContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
