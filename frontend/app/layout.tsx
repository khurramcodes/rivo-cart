import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/store/Providers";
import { AuthHydrator } from "@/features/auth/AuthHydrator";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});


export const metadata: Metadata = {
  title: "RivoCart - Online Shopping Platform",
  description: "RivoCart - Best website to purchase wide range of products online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Providers>
          <AuthHydrator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
