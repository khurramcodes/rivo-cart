import { Navbar } from "@/components/user/navbar/Navbar";
import { SecondaryNav } from "@/components/user/navbar/SecondaryNavbar";
import Topbar from "@/components/user/navbar/Topbar";
import { ToastContainer, Bounce } from "react-toastify";
import Footer from "@/components/user/layout/Footer";
import Copyright from './../../components/user/layout/Copyright';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Topbar />
      <div className='sticky top-0 z-50'>
        <Navbar />
        <SecondaryNav />
      </div>
      {children}
      <Footer />
      <Copyright />
      <ToastContainer
        position='top-right'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='dark'
        transition={Bounce}
      />
    </>
  );
}
