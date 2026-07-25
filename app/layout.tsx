import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://mav-rd-vial.vercel.app";
const DESCRIPCION_SITIO =
  "Aprende a conducir con confianza. Cursos teóricos, exámenes y diplomas de Muvo RD Vial, un proyecto de la asociación sin fines de lucro Mujeres al Volante RD.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Muvo RD Vial",
    template: "%s | Muvo RD Vial",
  },
  description: DESCRIPCION_SITIO,
  openGraph: {
    type: "website",
    locale: "es_DO",
    siteName: "Muvo RD Vial",
    title: "Muvo RD Vial",
    description: DESCRIPCION_SITIO,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muvo RD Vial - Embajadores de la educación vial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muvo RD Vial",
    description: DESCRIPCION_SITIO,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}