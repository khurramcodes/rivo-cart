"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import Image from "next/image";

export function NavBar() {
  const router = useRouter();
  const cartCount = useAppSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  return (
    <header className='sticky top-0 z-20 border-b border-zinc-200 bg-white backdrop-blur'>
      <div className='mx-auto flex max-w-6xl lg:max-w-7xl items-center gap-4 px-4 py-4'>
        <Link href='/'>
          <Image
            src='/images/logo.png'
            alt='Logo'
            width={160}
            height={40}
            className='object-cover'
            priority
            unoptimized
          />
        </Link>

        <Link href='/products' className='text-zinc-700 hover:text-black'>
          Products
        </Link>

        <div className='relative hidden flex-1 sm:block'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Input
            className='w-52 pl-9'
            placeholder='Search products…'
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const q = (e.currentTarget.value ?? "").trim();
              router.push(
                q ? `/products?q=${encodeURIComponent(q)}` : "/products"
              );
            }}
          />
        </div>

        <nav className='ml-auto flex items-center gap-3 text-sm'>
          <Link
            href='/cart'
            className='relative inline-flex items-center gap-2 text-zinc-700 hover:text-black'>
            <ShoppingCart className='h-4 w-4' />
            <span className='hidden sm:inline'>Cart</span>
            {cartCount > 0 ? (
              <span className='ml-1 rounded-full bg-black px-2 py-0.5 text-xs text-white'>
                {cartCount}
              </span>
            ) : null}
          </Link>
          {user ? (
            user.role === "ADMIN" ? (
              <Link href='/admin' className='text-zinc-700 hover:text-black'>
                Admin
              </Link>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='hidden sm:inline text-zinc-600'>
                  Hi, {user.name}
                </span>
                <Button
                  variant='ghost'
                  className='h-9 px-3'
                  onClick={() => void dispatch(logout())}>
                  Logout
                </Button>
              </div>
            )
          ) : (
            <div className='flex items-center gap-2'>
              <Link href='/login' className='text-zinc-700 hover:text-black'>
                Login
              </Link>
              <Link href='/register' className='text-zinc-700 hover:text-black'>
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}


