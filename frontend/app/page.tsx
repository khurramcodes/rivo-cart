import { Navbar } from "@/components/user/navbar/Navbar";
import { SecondaryNav } from "@/components/user/navbar/SecondaryNavbar";
import { HeroSection } from "@/components/user/homePage/HeroSection";
import { LatestProducts } from "@/components/user/product/LatestProducts";
import { BestSellingProducts } from "@/components/user/product/BestSellingProducts";
import { BestSellingCategories } from "@/components/user/category/BestSellingCategories";
import Footer from "@/components/user/Footer";
import Topbar from "@/components/user/navbar/Topbar";

export default function Home() {
  return (
    <div className='min-h-screen bg-white'>
      <Topbar />
      <div className='sticky top-0 z-50'>
        <Navbar />
        <SecondaryNav />
      </div>
      <main>
        <HeroSection
          headline='Nature’s Goodness, Delivered to Your Door.'
          description='Fresh, organic, and sustainably sourced products that nourish your body and delight your senses, shop healthy, live vibrant.'
          ctaText='Shop Now'
          ctaHref='/products'
          imageUrl='/images/hero.png'
          imageAlt='Hero image'
        />
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <LatestProducts limit={6} />
          <BestSellingProducts limit={8} />
          <BestSellingCategories limit={6} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
