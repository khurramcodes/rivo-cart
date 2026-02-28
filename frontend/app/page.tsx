import { NavBar } from "@/components/user/NavBar";
import { HeroSection } from "@/components/user/HeroSection";
import { LatestProducts } from "@/components/user/product/LatestProducts";
import { BestSellingProducts } from "@/components/user/product/BestSellingProducts";
import { BestSellingCategories } from "@/components/user/category/BestSellingCategories";
import Footer from "@/components/user/Footer";
import { SecondaryNav } from "@/components/user/SecondaryNavbar";

export default function Home() {
  return (
    <div className='min-h-screen bg-white'>
      <div className="sticky top-0 z-50">
        <NavBar />
        <SecondaryNav />
      </div>
      <main>
        <HeroSection
          headline="Everything you need, nothing you don't."
          description='Browse our curated collection of products. Add to cart, checkout with Cash on Delivery. Fast, simple, and secure.'
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
