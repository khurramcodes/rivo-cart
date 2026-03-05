import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/store/Providers";
import { authApi } from "@/services/authApi";
import { AuthHydrator } from "@/features/auth/AuthHydrator";
// import { GlobalLoader } from "@/components/ui/GlobalLoader";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "RivoCart - Online Shopping Platform",
  description: "RivoCart - Best website to purchase wide range of products online.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try{
    const me = await authApi.me();
    user = me.user;
  }catch{
    user = null;
  }
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
        <Providers initialUser={user}>
          <AuthHydrator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
