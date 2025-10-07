"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
{/*}
export const metadata = {
  title: "Contentstack Portal",
  description: "Contentstack Portal",
};*/}



export default function RootLayout({ children }) {
  console.log(children); // Should not be undefined
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark']}
        >
          <SidebarProvider>
            <AppSidebar>
              <main>
                  <SidebarTrigger/>
                  {children}
                </main>
            </AppSidebar>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
