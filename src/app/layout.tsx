import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WorkerProvider } from "@/app/context/chat-worker-context";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "./contexts/auth.context";
import { MedicalRecordsProvider } from "./contexts/medical-record.context";
import { Footer } from "@/components/footer";
import Head from "next/head";
import "../auth-sw";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vita",
  description: "Tu asistente de ficha médica privado y sencillo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col`}
      >
        <Head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
        </Head>
        <AuthProvider>
          <Navbar />
          <MedicalRecordsProvider>
            <WorkerProvider>{children}</WorkerProvider>
          </MedicalRecordsProvider>
          <Footer />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
