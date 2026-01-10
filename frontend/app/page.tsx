import { NavBar } from "@/components/user/NavBar";
import { HeroSection } from "@/components/user/HeroSection";
import { LatestProducts } from "@/components/user/LatestProducts";
import Footer from "@/components/user/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="mx-auto max-w-6xl lg:max-w-7xl px-4 py-10">
        <HeroSection
          headline="Everything you need, nothing you don't."
          description="Browse our curated collection of products. Add to cart, checkout with Cash on Delivery. Fast, simple, and secure."
          ctaText="Shop Now"
          ctaHref="/products"
          imageUrl="/images/hero.png"
          imageAlt="Hero image"
        />

        <LatestProducts limit={6} />
      </main>
      <Footer />
    </div>
  );
}
