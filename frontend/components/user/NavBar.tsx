"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingCart, Search, Heart } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Input } from "../ui/Input";
import { logout } from "@/store/slices/authSlice";
import { GlobalLoader } from "../ui/GlobalLoader";
import Logo from "../ui/Logo";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const cartCount = useAppSelector((s) =>
    (s.cart.cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
  );

  const { user, hydrated } = useAppSelector((s) => s.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pathname === "/search") {
      setSearchQuery(searchParams.get("q") ?? "");
      return;
    }
    setSearchQuery("");
  }, [pathname, searchParams]);

  const submitSearch = () => {
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (!hydrated) return <GlobalLoader />;

  return (
    <header className='border-b border-b-primary bg-primary'>
      <div className='mx-auto flex max-w-7xl items-center gap-4 px-4 py-4'>
        <Logo variant='white' />

        {/* Search */}
        <div className='relative hidden flex-1 md:block'>
          <form
            className='relative max-w-sm'
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}>
            <Input
              className='w-full pl-4'
              placeholder='Search products ...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type='submit'
              className='absolute right-1 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-zinc-600 hover:bg-white cursor-pointer'
              aria-label='Search products'>
              <Search className='h-4 w-4' />
            </button>
          </form>
        </div>

        <nav className='ml-auto flex items-center gap-4'>
          {/* Cart */}
          <Link href='/cart' className='relative text-white'>
            <ShoppingCart className='h-5 w-5' />
            {cartCount > 0 && (
              <span className='absolute -right-2 -top-2 rounded-full bg-zinc-900 px-1.5 text-xs text-white'>
                {cartCount}
              </span>
            )}
          </Link>

          {/* Desktop Account */}
          <div className='hidden md:flex items-center gap-3 text-sm'>
            {user ? (
              user.role === "ADMIN" ? (
                <Link href='/admin'>Admin</Link>
              ) : (
                <div className='relative' ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((p) => !p)}
                    className='flex items-center gap-1'>
                    Hi, {user.firstName || user.name}
                    <ChevronDown className='h-4 w-4' />
                  </button>

                  {menuOpen && (
                    <div className='absolute right-0 mt-2 w-40 rounded border bg-white shadow'>
                      <Link
                        href='/account'
                        className='block px-3 py-2 hover:bg-zinc-100 text-zinc-900'>
                        Account
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          void dispatch(logout());
                        }}
                        className='block w-full px-3 py-2 text-left hover:bg-zinc-100 text-zinc-900'>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className='text-white flex items-center gap-4'>
                <Link href='/login'>Login</Link>
              </p>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
