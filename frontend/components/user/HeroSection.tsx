import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  headline: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function HeroSection({
  headline,
  description,
  ctaText = "Shop Now",
  ctaHref = "/products",
  imageUrl = "/hero-placeholder.jpg",
  imageAlt = "Hero image",
}: HeroSectionProps) {
  return (
    <section className="relative h-125 w-full overflow-hidden rounded">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-12 lg:px-16">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-4 text-lg text-zinc-200 sm:text-xl">
            {description}
          </p>
          <Link
            href={ctaHref}
            className="mt-8 inline-flex items-center justify-center rounded bg-white px-6 py-3 text-base font-medium text-black transition hover:bg-zinc-100"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}

