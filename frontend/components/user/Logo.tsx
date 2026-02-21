import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  variant?: "white" | "black";
}

export default function Logo({
  width = 160,
  height = 40,
  priority = false,
  className = "",
  variant = "black",
}: LogoProps) {

  const src =
    variant === "white" ? "/images/logo-white.png" : "/images/logo-black.png";

  return (
    <Link href='/'>
      <Image
        src={src}
        alt='Logo'
        width={width}
        height={height}
        priority={priority}
        className={className}
      />
    </Link>
  );
}
