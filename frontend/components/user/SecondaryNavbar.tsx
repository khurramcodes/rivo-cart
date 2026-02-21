"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { catalogApi } from "@/services/catalogApi";
import type { Category } from "@/types";

export function SecondaryNav() {
  const { user } = useAppSelector((s) => s.auth);
  const [categories, setCategories] = useState<Category[]>([]);

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
    <div className='border-b bg-zinc-50'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-3 text-sm'>
        <Link href='/products' className='font-medium text-zinc-600 hover:text-black'>
          Products
        </Link>

        {parentCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className='text-zinc-600 hover:text-black'>
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
