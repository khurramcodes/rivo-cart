"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "../../ui/Input";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (pathname === "/search") {
      setSearchQuery(searchParams.get("q") ?? "");
    } else {
      setSearchQuery("");
    }
  }, [pathname, searchParams]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <form className='relative max-w-sm mx-auto' onSubmit={submitSearch}>
      <Input
        className='w-full pl-4 rounded-4xl'
        placeholder='Search products ...'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <button
        type='submit'
        className='absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-primary'>
        <Search className='h-5 w-5' />
      </button>
    </form>
  );
}
