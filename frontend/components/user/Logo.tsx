import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export default function Logo({
  width = 160,
  height = 40,
  priority = false,
  className = "",
}: LogoProps) {
  return (
    <Link href='/'>
        <Image
          src='/images/logo.png'
          alt='Logo'
          width={width}
          height={height}
          priority={priority}
          className={className}
        />
    </Link>
  );
}
