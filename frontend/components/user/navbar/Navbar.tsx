"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ShoppingCart,
  Search,
  Heart,
  User2,
  X,
  Menu,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Input } from "../../ui/Input";
import { logout } from "@/store/slices/authSlice";
import { GlobalLoader } from "../../ui/GlobalLoader";
import Logo from "../../ui/Logo";
import { catalogApi } from "@/services/catalogApi";
import { Category } from "@/types";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const cartCount = useAppSelector((s) =>
    (s.cart.cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
  );

  const { user, hydrated } = useAppSelector((s) => s.auth);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await catalogApi.listCategories();
        if (!mounted) return;
        setCategories(all);
      } catch {
        if (mounted) setCategories([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  // Sync search input with URL
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

  // Close desktop dropdown if clicked outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Disable page scrolling when menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (!hydrated) return <GlobalLoader />;

  const handleMobileNav = (url: string) => {
    setMobileMenuOpen(false);
    router.push(url);
  };

  return (
    <header className='bg-white border-b border-border'>
      <div className='mx-auto flex justify-between max-w-7xl gap-4 px-4 py-4'>
        {/* Logo */}
        <div className='shrink-0'>
          <Logo variant='white' />
        </div>

        {/* Search */}
        <div className='hidden flex-1 md:block'>
          <form
            className='relative max-w-sm mx-auto'
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

        {/* Right Nav */}
        <nav className='ml-auto flex items-center gap-4'>
          {/* Wishlist */}
          <div>
            <Heart className='h-5 w-5' />
          </div>

          {/* Cart */}
          <Link href='/cart' className='relative text-accent-foreground'>
            <ShoppingCart className='h-5 w-5' />
            {cartCount > 0 && (
              <span className='absolute -right-2 -top-2 rounded-full bg-zinc-900 px-1.5 text-xs text-accent-foreground'>
                {cartCount}
              </span>
            )}
          </Link>

          {/* Desktop Account */}
          <div className='hidden md:flex items-center gap-3 font-medium'>
            {user ? (
              user.role === "ADMIN" ? (
                <Link href='/admin'>Admin</Link>
              ) : (
                <div className='relative' ref={menuRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className='flex items-center gap-1'>
                    Hi, {user.firstName || user.name}
                    <ChevronDown className='h-4 w-4' />
                  </button>

                  {dropdownOpen && (
                    <div className='absolute right-0 mt-2 w-40 rounded border bg-white shadow z-50'>
                      <Link
                        href='/account'
                        className='block px-3 py-2 hover:bg-zinc-100 text-zinc-900'>
                        Account
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
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
              <p className='text-accent-foreground flex items-center gap-1'>
                <User2 className='h-5 w-5' />
                <Link href='/login'>Login</Link> /{" "}
                <Link href='/register'>Register</Link>
              </p>
            )}
          </div>

          {/* Mobile Hamburger Icon */}
          <button
            className='md:hidden'
            onClick={() => setMobileMenuOpen((p) => !p)}>
            <Menu className='h-6 w-6' />
          </button>
        </nav>
      </div>

      {/* Off-Canvas Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } bg-black/60`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className='flex justify-between items-center p-4 border-b border-border'>
          <Logo variant='white' />
          <button onClick={() => setMobileMenuOpen(false)}>
            <X className='h-6 w-6' />
          </button>
        </div>

        <nav className='flex flex-col gap-4 text-lg mt-6 px-4'>
          {/* Categories */}
          <div className='flex flex-col gap-3'>
            {parentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleMobileNav(`/category/${cat.slug}`)}
                className='text-zinc-600 hover:text-black text-left'>
                {cat.name}
              </button>
            ))}
          </div>

          {/* User Account */}
          <div className='mt-4 text-lg'>
            {user ? (
              <div className='relative' ref={menuRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  className='flex items-center gap-1 w-full'>
                  Hi, {user.firstName || user.name}
                  <ChevronDown className='h-4 w-4' />
                </button>

                {dropdownOpen && (
                  <div className='absolute left-0 mt-2 w-full rounded border bg-white shadow z-50'>
                    <button
                      onClick={() => {
                        handleMobileNav("/account");
                        setDropdownOpen(false);
                      }}
                      className='block w-full px-3 py-2 text-left hover:bg-zinc-100 text-zinc-900'>
                      Account
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                        void dispatch(logout());
                      }}
                      className='block w-full px-3 py-2 text-left hover:bg-zinc-100 text-zinc-900'>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col gap-2 mt-2'>
                <button
                  onClick={() => handleMobileNav("/login")}
                  className='text-left'>
                  Login
                </button>
                <button
                  onClick={() => handleMobileNav("/register")}
                  className='text-left'>
                  Register
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
