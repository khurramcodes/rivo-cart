"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authApi";
import { logout, setUser } from "@/store/slices/authSlice";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status === "loading") return;
    let mounted = true;
    (async () => {
      try {
        const me = await authApi.me();
        if (!mounted) return;
        dispatch(setUser(me.user));
        if (me.user.role !== "ADMIN") router.replace("/admin/login");
      } catch {
        if (!mounted) return;
        dispatch(setUser(null));
        router.replace("/admin/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch, pathname, router, status]);

  return (
    <div className='min-h-screen bg-white'>
      <header className='border-b border-zinc-200'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3'>
          <nav className='flex items-center gap-3 text-base text-zinc-700'>
            <Link href='/'>
              <Image
                src='/images/logo.png'
                alt='Logo'
                width={120}
                height={40}
                className='object-cover w-auto h-10'
                priority
                unoptimized
              />
            </Link>
            <Link href='/admin' className='hover:text-black'>
              Dahsboard
            </Link>
            <Link href='/admin/categories' className='hover:text-black'>
              Categories
            </Link>
            <Link href='/admin/products' className='hover:text-black'>
              Products
            </Link>
            <Link href='/admin/orders' className='hover:text-black'>
              Orders
            </Link>
          </nav>
          {user?.role === "ADMIN" ? (
            <div className='flex items-center gap-4'>
              <span className='hidden sm:inline text-zinc-600'>Hi, Admin</span>
              <Button
                variant='ghost'
                className='text-base h-9 px-3'
                onClick={() => {
                  void dispatch(logout()).then(() =>
                    router.replace("/admin/login")
                  );
                }}>
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </header>
      <main className='mx-auto max-w-6xl px-4 py-10'>{children}</main>
    </div>
  );
}
