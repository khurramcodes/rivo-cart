import Footer from "@/components/user/layout/Copyright";
import { Navbar } from "@/components/user/navbar/Navbar";
import { SecondaryNav } from "@/components/user/navbar/SecondaryNavbar";
import Topbar from "@/components/user/navbar/Topbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Topbar />
      <div className="sticky top-0 z-50">
        <Navbar />
        <SecondaryNav />
      </div>
      {children}
      <Footer />
    </>
  );
}
