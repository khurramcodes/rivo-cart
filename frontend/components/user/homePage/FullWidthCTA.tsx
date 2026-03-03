"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

interface FullWidthCTAProps {
  image: string;
  heading?: string;
  subheading?: string;
  buttonText?: string;
  buttonLink?: string;
  overlay?: boolean;
  className?: string;
  height?: "sm" | "md" | "lg" | "xl" | "auto";
}

const heightVariants = {
  sm: "min-h-[220px] md:min-h-[260px]",
  md: "min-h-[260px] md:min-h-[340px]",
  lg: "min-h-[320px] md:min-h-[420px]",
  xl: "min-h-[380px] md:min-h-[560px]",
  auto: "py-16 md:py-24", // content-based height
};

const FullWidthCTA = ({
  image,
  heading,
  subheading,
  buttonText,
  buttonLink,
  overlay = true,
  height = "md",
  className,
}: FullWidthCTAProps) => {
  const hasContent = heading || subheading || (buttonText && buttonLink);

  return (
    <section
      className={clsx(
        "relative w-full overflow-hidden flex items-center",
        heightVariants[height],
        className,
      )}>
      {/* Background Image */}
      <Image
        src={image}
        alt={heading || "CTA banner"}
        fill
        sizes='100vw'
        className='object-cover object-center'
        priority={false}
      />

      {/* Overlay */}
      {overlay && <div className='absolute inset-0 bg-black/50' />}

      {/* Content */}
      {hasContent && (
        <div className='relative z-10 w-full px-4 sm:px-6 md:px-12 text-center'>
          <div className='max-w-3xl mx-auto text-white'>
            {heading && (
              <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight'>
                {heading}
              </h2>
            )}

            {subheading && (
              <p className='mt-3 text-sm sm:text-base md:text-lg text-white/90'>
                {subheading}
              </p>
            )}

            {buttonText && buttonLink && (
              <Link
                href={buttonLink}
                className='inline-block mt-6 rounded-lg bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 font-medium text-sm sm:text-base hover:bg-zinc-100 transition'>
                {buttonText}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default FullWidthCTA;
