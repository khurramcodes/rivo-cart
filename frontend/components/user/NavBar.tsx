// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useRef, useState } from "react";
// import { ChevronDown, ShoppingCart, Search } from "lucide-react";
// import { useAppSelector } from "@/store/hooks";
// import { Input } from "../ui/Input";
// import { useAppDispatch } from "@/store/hooks";
// import { logout } from "@/store/slices/authSlice";
// import { GlobalLoader } from "../ui/GlobalLoader";
// import Logo from "./Logo";

// export function NavBar() {
//   const router = useRouter();
//   const cartCount = useAppSelector((s) =>
//     (s.cart.cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
//   );
//   const { user, hydrated } = useAppSelector((s) => s.auth);

//   const dispatch = useAppDispatch();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const menuRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!menuOpen) return;
//     const handleClick = (event: MouseEvent) => {
//       if (!menuRef.current) return;
//       if (!menuRef.current.contains(event.target as Node)) {
//         setMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClick);
//     return () => document.removeEventListener("mousedown", handleClick);
//   }, [menuOpen]);

//   if (!hydrated) {
//     return <GlobalLoader />;
//   }

//   return (
//     <header className='sticky top-0 z-20 border-b border-zinc-200 bg-white backdrop-blur'>
//       <div className='mx-auto flex max-w-6xl lg:max-w-7xl items-center gap-4 px-4 py-4'>
//         <Logo />

//         <Link href='/products' className='text-zinc-700 hover:text-black'>
//           Products
//         </Link>

//         <div className='relative hidden flex-1 sm:block'>
//           <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
//           <Input
//             className='w-52 pl-9'
//             placeholder='Search products…'
//             onKeyDown={(e) => {
//               if (e.key !== "Enter") return;
//               const q = (e.currentTarget.value ?? "").trim();
//               router.push(
//                 q ? `/products?q=${encodeURIComponent(q)}` : "/products",
//               );
//             }}
//           />
//         </div>

//         <nav className='ml-auto flex items-center gap-3 text-sm'>
//           <Link
//             href='/cart'
//             className='relative inline-flex items-center gap-2 text-zinc-700 hover:text-black'>
//             <ShoppingCart className='h-4 w-4' />
//             <span className='hidden sm:inline'>Cart</span>
//             {cartCount > 0 ? (
//               <span className='ml-1 rounded-full bg-black px-2 py-0.5 text-xs text-white'>
//                 {cartCount}
//               </span>
//             ) : null}
//           </Link>
//           {user ? (
//             user.role === "ADMIN" ? (
//               <Link href='/admin' className='text-zinc-700 hover:text-black'>
//                 Admin
//               </Link>
//             ) : (
//               <div className='relative' ref={menuRef}>
//                 <button
//                   type='button'
//                   onClick={() => setMenuOpen((prev) => !prev)}
//                   className='inline-flex items-center gap-1 text-zinc-700 hover:text-black'>
//                   <span className='hidden sm:inline text-zinc-600'>
//                     Hi, {user.firstName || user.name}
//                   </span>
//                   <ChevronDown className='h-4 w-4' />
//                 </button>
//                 {menuOpen ? (
//                   <div className='absolute right-0 mt-2 w-40 rounded border border-zinc-200 bg-white py-1 text-sm shadow-sm'>
//                     <Link
//                       href='/account'
//                       className='block px-3 py-2 text-zinc-700 hover:bg-zinc-100'
//                       onClick={() => setMenuOpen(false)}>
//                       Account
//                     </Link>
//                     <button
//                       type='button'
//                       className='block w-full px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100'
//                       onClick={() => {
//                         setMenuOpen(false);
//                         void dispatch(logout());
//                       }}>
//                       Logout
//                     </button>
//                   </div>
//                 ) : null}
//               </div>
//             )
//           ) : (
//             <div className='flex items-center gap-2'>
//               <Link href='/login' className='text-zinc-700 hover:text-black'>
//                 Login
//               </Link>
//               <Link href='/register' className='text-zinc-700 hover:text-black'>
//                 Register
//               </Link>
//             </div>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShoppingCart, Search, Heart } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Input } from "../ui/Input";
import { logout } from "@/store/slices/authSlice";
import { GlobalLoader } from "../ui/GlobalLoader";
import Logo from "./Logo";

export function NavBar() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const cartCount = useAppSelector((s) =>
    (s.cart.cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
  );

  // const wishlistCount = useAppSelector((s) => s.wishlist.items?.length ?? 0);

  const { user, hydrated } = useAppSelector((s) => s.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    <header className='sticky top-0 z-30 border-b bg-white'>
      <div className='mx-auto flex max-w-7xl items-center gap-4 px-4 py-4'>
        <Logo />

        {/* Search */}
        <div className='relative hidden flex-1 md:block'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
          <Input
            className='w-full max-w-sm pl-9'
            placeholder='Search products…'
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const q = (e.currentTarget.value ?? "").trim();
              router.push(
                q ? `/products?q=${encodeURIComponent(q)}` : "/products",
              );
            }}
          />
        </div>

        <nav className='ml-auto flex items-center gap-4'>
          {/* Wishlist (logged in only) */}
          {user && (
            <Link
              href='/wishlist'
              className='relative text-zinc-700 hover:text-black'>
              <Heart className='h-5 w-5' />
              {/* {wishlistCount > 0 && (
                <span className='absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white'>
                  {wishlistCount}
                </span>
              )} */}
            </Link>
          )}

          {/* Cart */}
          <Link
            href='/cart'
            className='relative text-zinc-700 hover:text-black'>
            <ShoppingCart className='h-5 w-5' />
            {cartCount > 0 && (
              <span className='absolute -right-2 -top-2 rounded-full bg-black px-1.5 text-xs text-white'>
                {cartCount}
              </span>
            )}
          </Link>

          {/* Desktop Account */}
          <div className='hidden md:flex items-center gap-3 text-sm text-zinc-900'>
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
                        className='block px-3 py-2 hover:bg-zinc-100'>
                        Account
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          void dispatch(logout());
                        }}
                        className='block w-full px-3 py-2 text-left hover:bg-zinc-100'>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <p className="text-zinc-900 flex items-center gap-4">
                <Link href='/login'>Login</Link>
                <Link href='/register'>Register</Link>
              </p>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
