import Footer from "@/components/user/Footer";
import { NavBar } from "@/components/user/NavBar";
import { SecondaryNav } from "@/components/user/SecondaryNavbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      <SecondaryNav />
      {children}
      <Footer />
    </>
  );
}
