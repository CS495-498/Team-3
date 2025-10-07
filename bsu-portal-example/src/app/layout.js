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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark']}
        >
          <SidebarProvider>
            <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
              <AppSidebar />
              
              <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                {children}
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
