import Footer from "@/components/user/Footer";
import { NavBar } from "@/components/user/NavBar";
import { Providers } from "@/store/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <Providers>{children}</Providers>
      <Footer />
    </>
  );
}
