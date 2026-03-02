"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { catalogApi } from "@/services/catalogApi";
import type { Category } from "@/types";
import { usePathname } from "next/navigation";

export function SecondaryNav() {
  const { user } = useAppSelector((s) => s.auth);
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname();

const isActive = (path: string, exact = false) => {
  if (exact) return pathname === path;
  return pathname.startsWith(path);
};

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

  return (
    <div className='border-b border-b-border bg-zinc-50 hidden md:block'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-3 text-base overflow-x-auto whitespace-nowrap'>
        <Link
          href='/products'
          className={`block transition-colors ${
            isActive(`/products`, true)
              ? "text-primary font-semibold"
              : "text-zinc-600 hover:text-primary"
          }`}>
          Products
        </Link>

        {parentCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`block transition-colors ${
              isActive(`/category/${cat.slug}`)
                ? "text-primary font-semibold"
                : "text-zinc-600 hover:text-primary"
            }`}>
            {cat.name}
          </Link>
        ))}

        {/* Mobile Login/Register */}
        {!user && (
          <div className='ml-auto flex gap-4 md:hidden'>
            <Link href='/login'>Login</Link>
            <Link href='/register'>Register</Link>
          </div>
        )}
      </div>
    </div>
  );
}
