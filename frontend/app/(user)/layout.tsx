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
      <div className="sticky top-0 z-50">
        <NavBar />
        <SecondaryNav />
      </div>
      {children}
      <Footer />
    </>
  );
}
