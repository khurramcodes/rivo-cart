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
  height?: "sm" | "md" | "lg";
}

const heightVariants = {
  sm: "h-[240px]",
  md: "h-[320px]",
  lg: "h-[420px]",
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
  return (
    <section
      className={clsx(
        "relative w-full overflow-hidden",
        heightVariants[height],
        className,
      )}>
      {/* Background image */}
      <Image
        src={image}
        alt={heading || ""}
        fill
        priority={false}
        className='object-cover'
      />

      {/* Overlay */}
      {overlay && <div className='absolute inset-0 bg-black/40' />}

      {/* Content */}
      <div className='relative z-10 flex h-full w-full items-center justify-center'>
        <div className='text-center text-white px-4'>
          <h2 className='text-3xl md:text-4xl font-semibold tracking-tight'>
            {heading}
          </h2>

          {subheading && (
            <p className='mt-2 text-white/90 text-sm md:text-base'>
              {subheading}
            </p>
          )}

          {buttonText && buttonLink && (
            <Link
              href={buttonLink}
              className='inline-block mt-5 rounded bg-white text-black px-6 py-2 font-medium hover:bg-zinc-100 transition'>
              {buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default FullWidthCTA;
